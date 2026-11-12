'use client';

import { useEffect, useState } from 'react';
import { villagesApi, Announcement } from '@/lib/api/villages';
import { regionsApi } from '@/lib/api/regions';

export default function AnnouncementsPage() {
  const [userRole, setUserRole] = useState('');
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    title: '',
    content: '',
    summary: '',
    priority: 'NORMAL',
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
        const data = await villagesApi.getAnnouncements(selectedVillage, filterStatus || undefined);
        setAnnouncements(data);
      } catch (err) {
        setError('Gagal mengambil data pengumuman');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedVillage, filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const data = {
      villageId: selectedVillage,
      title: form.title,
      content: form.content,
      summary: form.summary,
      priority: form.priority,
      status: form.status,
      publishedAt: form.publishedAt || undefined,
      expiredAt: form.expiredAt || undefined,
      isPublic: form.isPublic,
    };

    try {
      if (editingId) {
        await villagesApi.updateAnnouncement(editingId, data);
        setSuccess('Pengumuman berhasil diperbarui!');
      } else {
        await villagesApi.createAnnouncement(data);
        setSuccess('Pengumuman berhasil ditambahkan!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        title: '', content: '', summary: '', priority: 'NORMAL',
        status: 'DRAFT', publishedAt: '', expiredAt: '', isPublic: true,
      });
      const refreshed = await villagesApi.getAnnouncements(selectedVillage, filterStatus || undefined);
      setAnnouncements(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: Announcement) => {
    setForm({
      title: item.title,
      content: item.content,
      summary: item.summary || '',
      priority: item.priority,
      status: item.status,
      publishedAt: item.publishedAt ? item.publishedAt.split('T')[0] : '',
      expiredAt: item.expiredAt ? item.expiredAt.split('T')[0] : '',
      isPublic: item.isPublic,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengumuman ini?')) return;
    try {
      await villagesApi.deleteAnnouncement(id);
      setSuccess('Pengumuman berhasil dihapus!');
      const refreshed = await villagesApi.getAnnouncements(selectedVillage, filterStatus || undefined);
      setAnnouncements(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus data');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await villagesApi.publishAnnouncement(id);
      setSuccess('Pengumuman berhasil dipublikasikan!');
      const refreshed = await villagesApi.getAnnouncements(selectedVillage, filterStatus || undefined);
      setAnnouncements(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mempublikasikan');
    }
  };

  const getPriorityInfo = (priority: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      LOW: { label: '🔵 Rendah', color: 'badge-info' },
      NORMAL: { label: '🟢 Normal', color: 'badge-success' },
      HIGH: { label: '🟠 Tinggi', color: 'badge-warning' },
      URGENT: { label: '🔴 Mendesak', color: 'badge-danger' },
    };
    return labels[priority] || { label: priority, color: 'badge-gray' };
  };

  const getStatusInfo = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      DRAFT: { label: '📝 Draft', color: 'badge-gray' },
      PUBLISHED: { label: '📢 Published', color: 'badge-success' },
      ARCHIVED: { label: '📦 Archived', color: 'badge-warning' },
    };
    return labels[status] || { label: status, color: 'badge-gray' };
  };

  const filtered = announcements.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stats = {
    total: announcements.length,
    draft: announcements.filter((a) => a.status === 'DRAFT').length,
    published: announcements.filter((a) => a.status === 'PUBLISHED').length,
    urgent: announcements.filter((a) => a.priority === 'URGENT').length,
  };

  if (loading && announcements.length === 0 && villages.length === 0) {
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
            <span className="text-4xl">📢</span>
            Pengumuman
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola pengumuman desa ({announcements.length} pengumuman)
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setForm({
                title: '', content: '', summary: '', priority: 'NORMAL',
                status: 'DRAFT', publishedAt: '', expiredAt: '', isPublic: true,
              });
            }}
            className="btn-primary"
          >
            {showForm ? '✕ Tutup' : '+ Tambah Pengumuman'}
          </button>
        )}
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-gradient bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-white/80 text-xs font-medium">Total</p>
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
        <div className="card-gradient bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <p className="text-white/80 text-xs font-medium">🔴 Mendesak</p>
          <p className="text-3xl font-bold mt-1">{stats.urgent}</p>
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
                  {editingId ? '✏️' : '➕'}
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Judul Pengumuman</label>
                  <input
                    type="text"
                    className="input"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Pendaftaran Bantuan Sosial"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Isi Pengumuman</label>
                  <textarea
                    className="input"
                    rows={5}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Tulis isi pengumuman..."
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Ringkasan (opsional)</label>
                  <input
                    type="text"
                    className="input"
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    placeholder="Ringkasan singkat..."
                  />
                </div>
                <div>
                  <label className="label">Prioritas</label>
                  <select
                    className="input"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="LOW">🔵 Rendah</option>
                    <option value="NORMAL">🟢 Normal</option>
                    <option value="HIGH">🟠 Tinggi</option>
                    <option value="URGENT">🔴 Mendesak</option>
                  </select>
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
                  {saving ? '💾 Menyimpan...' : '💾 Simpan'}
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
          {announcements.length > 0 && (
            <div className="card">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    className="input pl-12"
                    placeholder="Cari pengumuman..."
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
                      <th>Pengumuman</th>
                      <th>Prioritas</th>
                      <th>Status</th>
                      <th>Publik</th>
                      {canManage && <th className="text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const priorityInfo = getPriorityInfo(item.priority);
                      const statusInfo = getStatusInfo(item.status);
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-xl text-white shadow-md">
                                📢
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{item.title}</p>
                                {item.summary && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                    {item.summary}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={priorityInfo.color}>{priorityInfo.label}</span>
                          </td>
                          <td>
                            <span className={statusInfo.color}>{statusInfo.label}</span>
                          </td>
                          <td>
                            <span className={item.isPublic ? 'text-green-500' : 'text-gray-400'}>
                              {item.isPublic ? '✅' : '🔒'}
                            </span>
                          </td>
                          {canManage && (
                            <td>
                              <div className="flex items-center justify-end gap-2">
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
                        <td colSpan={canManage ? 5 : 4} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <span className="text-5xl">📢</span>
                            <p className="text-gray-500 font-medium">
                              {searchTerm || filterStatus
                                ? 'Tidak ada pengumuman yang cocok'
                                : 'Belum ada pengumuman'}
                            </p>
                            {canManage && !searchTerm && !filterStatus && (
                              <button
                                onClick={() => setShowForm(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                + Tambah pengumuman pertama
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