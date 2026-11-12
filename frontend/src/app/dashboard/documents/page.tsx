'use client';

import { useEffect, useState } from 'react';
import { villagesApi, PublicDocument } from '@/lib/api/villages';
import { regionsApi } from '@/lib/api/regions';

export default function DocumentsPage() {
  const [userRole, setUserRole] = useState('');
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    status: 'DRAFT',
    publishedAt: '',
    expiredAt: '',
    isPublic: true,
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserRole(parsed.role);
    }

    const fetchVillages = async () => {
      try {
        const data = await regionsApi.getVillages();
        setVillages(data);
        if (data.length > 0 && !selectedVillage) {
          setSelectedVillage(data[0].id);
        }
      } catch (err) {
        console.error('Gagal mengambil desa:', err);
      }
    };
    fetchVillages();
  }, []);

  const canManage = userRole === 'SUPER_ADMIN' || userRole === 'VILLAGE_ADMIN';

  useEffect(() => {
    if (!selectedVillage) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await villagesApi.getDocuments(selectedVillage, filterStatus || undefined);
        setDocuments(data);
      } catch (err) {
        setError('Gagal mengambil data dokumen');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedVillage, filterStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal 10 MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await villagesApi.updateDocument(editingId, {
          title: form.title,
          description: form.description,
          category: form.category,
          tags: form.tags,
          status: form.status,
          publishedAt: form.publishedAt || undefined,
          expiredAt: form.expiredAt || undefined,
          isPublic: form.isPublic,
        });
        setSuccess('Dokumen berhasil diperbarui!');
      } else {
        if (!selectedFile) {
          setError('File wajib dipilih');
          setSaving(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('villageId', selectedVillage);
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('category', form.category);
        formData.append('tags', form.tags);
        formData.append('status', form.status);
        formData.append('isPublic', String(form.isPublic));
        if (form.publishedAt) formData.append('publishedAt', form.publishedAt);
        if (form.expiredAt) formData.append('expiredAt', form.expiredAt);

        await villagesApi.createDocument(formData);
        setSuccess('Dokumen berhasil diupload!');
      }

      setShowForm(false);
      setEditingId(null);
      setSelectedFile(null);
      setForm({
        title: '', description: '', category: '', tags: '',
        status: 'DRAFT', publishedAt: '', expiredAt: '', isPublic: true,
      });

      const refreshed = await villagesApi.getDocuments(selectedVillage, filterStatus || undefined);
      setDocuments(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: PublicDocument) => {
    setForm({
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      tags: item.tags || '',
      status: item.status,
      publishedAt: item.publishedAt ? item.publishedAt.split('T')[0] : '',
      expiredAt: item.expiredAt ? item.expiredAt.split('T')[0] : '',
      isPublic: item.isPublic,
    });
    setEditingId(item.id);
    setShowForm(true);
    setSelectedFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus dokumen ini?')) return;
    try {
      await villagesApi.deleteDocument(id);
      setSuccess('Dokumen berhasil dihapus!');
      const refreshed = await villagesApi.getDocuments(selectedVillage, filterStatus || undefined);
      setDocuments(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus data');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await villagesApi.publishDocument(id);
      setSuccess('Dokumen berhasil dipublikasikan!');
      const refreshed = await villagesApi.getDocuments(selectedVillage, filterStatus || undefined);
      setDocuments(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mempublikasikan');
    }
  };

  const handleDownload = (id: string) => {
    window.open(villagesApi.getDownloadUrl(id), '_blank');
  };

  const getStatusInfo = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      DRAFT: { label: '📝 Draft', color: 'badge-gray' },
      PUBLISHED: { label: '📢 Published', color: 'badge-success' },
      ARCHIVED: { label: '📦 Archived', color: 'badge-warning' },
    };
    return labels[status] || { label: status, color: 'badge-gray' };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type === 'pdf') return '📄';
    if (['doc', 'docx'].includes(type)) return '📝';
    if (['xls', 'xlsx'].includes(type)) return '📊';
    if (['jpg', 'jpeg', 'png'].includes(type)) return '🖼️';
    return '📁';
  };

  const filtered = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.category || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stats = {
    total: documents.length,
    draft: documents.filter((d) => d.status === 'DRAFT').length,
    published: documents.filter((d) => d.status === 'PUBLISHED').length,
    downloads: documents.reduce((sum, d) => sum + d.downloads, 0),
  };

  if (loading && documents.length === 0 && villages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton"></div>
        <div className="h-96 skeleton"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">📄</span>
            Dokumen Publik
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola dokumen publik desa ({documents.length} dokumen)
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setSelectedFile(null);
              setForm({
                title: '', description: '', category: '', tags: '',
                status: 'DRAFT', publishedAt: '', expiredAt: '', isPublic: true,
              });
            }}
            className="btn-primary"
          >
            {showForm ? '✕ Tutup' : '+ Upload Dokumen'}
          </button>
        )}
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-gradient bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-white/80 text-xs font-medium">Total Dokumen</p>
          <p className="text-3xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="card-gradient bg-gradient-to-br from-gray-500 to-gray-600 text-white">
          <p className="text-white/80 text-xs font-medium">📝 Draft</p>
          <p className="text-3xl font-bold mt-1">{stats.draft}</p>
        </div>
        <div className="card-gradient bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <p className="text-white/80 text-xs font-medium">📢 Published</p>
          <p className="text-3xl font-bold mt-1">{stats.published}</p>
        </div>
        <div className="card-gradient bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <p className="text-white/80 text-xs font-medium">⬇️ Total Download</p>
          <p className="text-3xl font-bold mt-1">{stats.downloads}</p>
        </div>
      </div>

      {/* Pilih Desa */}
      <div className="card">
        <label className="label">📍 Pilih Desa</label>
        <select
          className="input max-w-md"
          value={selectedVillage}
          onChange={(e) => setSelectedVillage(e.target.value)}
        >
          <option value="">-- Pilih Desa --</option>
          {villages.map((v: any) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-2 animate-slide-in">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-xl flex items-center gap-2 animate-slide-in">
          <span className="text-green-500 text-lg">✅</span>
          <p className="text-green-700 text-sm font-medium">{success}</p>
        </div>
      )}

      {selectedVillage && (
        <>
          {/* Form */}
          {showForm && canManage && (
            <form onSubmit={handleSubmit} className="card space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-xl text-white shadow-lg">
                  {editingId ? '✏️' : '📤'}
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? 'Edit Dokumen' : 'Upload Dokumen Baru'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Judul Dokumen</label>
                  <input
                    type="text"
                    className="input"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Peraturan Desa No. 1 Tahun 2026"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Deskripsi</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Deskripsi dokumen..."
                  />
                </div>

                {/* File Upload - HANYA untuk Create */}
                {!editingId && (
                  <div className="md:col-span-2">
                    <label className="label">
                      File Dokumen (PDF, DOC, XLS, Gambar - Maks 10 MB)
                    </label>
                    <input
                      type="file"
                      className="input"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      required
                    />
                    {selectedFile && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-xl flex items-center gap-2">
                        <span className="text-2xl">{getFileIcon(selectedFile.name.split('.').pop() || '')}</span>
                        <div>
                          <p className="text-sm font-medium text-blue-700">{selectedFile.name}</p>
                          <p className="text-xs text-blue-600">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="label">Kategori</label>
                  <input
                    type="text"
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Peraturan, Laporan, Formulir, dll"
                  />
                </div>
                <div>
                  <label className="label">Tags</label>
                  <input
                    type="text"
                    className="input"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="desa, laporan (pisah dengan koma)"
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="DRAFT">📝 Draft</option>
                    <option value="PUBLISHED">📢 Published</option>
                    <option value="ARCHIVED">📦 Archived</option>
                  </select>
                </div>
                <div>
                  <label className="label">Tanggal Terbit</label>
                  <input
                    type="date"
                    className="input"
                    value={form.publishedAt}
                    onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Tanggal Kadaluarsa</label>
                  <input
                    type="date"
                    className="input"
                    value={form.expiredAt}
                    onChange={(e) => setForm({ ...form, expiredAt: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPublic}
                      onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                    />
                    Tampilkan ke Publik
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button type="submit" disabled={saving} className="btn-success">
                  {saving ? '📤 Mengupload...' : editingId ? '💾 Simpan' : '📤 Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Batal
                </button>
              </div>
            </form>
          )}

          {/* Search & Filter */}
          {documents.length > 0 && (
            <div className="card">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    className="input pl-12"
                    placeholder="Cari dokumen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="input md:w-48"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value="DRAFT">📝 Draft</option>
                  <option value="PUBLISHED">📢 Published</option>
                  <option value="ARCHIVED">📦 Archived</option>
                </select>
              </div>
            </div>
          )}

          {/* Tabel */}
          {loading ? (
            <div className="card">
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Dokumen</th>
                      <th>Kategori</th>
                      <th>Ukuran</th>
                      <th>Downloads</th>
                      <th>Status</th>
                      {canManage && <th className="text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const statusInfo = getStatusInfo(item.status);
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-md">
                                {getFileIcon(item.fileType)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{item.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                                  {item.fileName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>
                            {item.category ? (
                              <span className="badge-info">{item.category}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td>
                            <span className="text-sm text-gray-600">
                              {formatFileSize(item.fileSize)}
                            </span>
                          </td>
                          <td>
                            <span className="badge-gray">⬇️ {item.downloads}</span>
                          </td>
                          <td>
                            <span className={statusInfo.color}>{statusInfo.label}</span>
                          </td>
                          {canManage && (
                            <td>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleDownload(item.id)}
                                  className="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center transition-colors"
                                  title="Download"
                                >
                                  ⬇️
                                </button>
                                {item.status === 'DRAFT' && (
                                  <button
                                    onClick={() => handlePublish(item.id)}
                                    className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                                    title="Publikasikan"
                                  >
                                    📢
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                                  title="Hapus"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={canManage ? 6 : 5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <span className="text-5xl">📄</span>
                            <p className="text-gray-500 font-medium">
                              {searchTerm || filterStatus
                                ? 'Tidak ada dokumen yang cocok'
                                : 'Belum ada dokumen'}
                            </p>
                            {canManage && !searchTerm && !filterStatus && (
                              <button
                                onClick={() => setShowForm(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                + Upload dokumen pertama
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}