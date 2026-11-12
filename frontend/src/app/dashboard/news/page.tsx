'use client';

import { useEffect, useState } from 'react';
import { villagesApi, News } from '@/lib/api/villages';
import { regionsApi } from '@/lib/api/regions';

export default function NewsPage() {
  const [userRole, setUserRole] = useState('');
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [newsList, setNewsList] = useState<News[]>([]);
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
    excerpt: '',
    thumbnailUrl: '',
    authorName: '',
    category: '',
    tags: '',
    status: 'DRAFT',
    publishedAt: '',
    isFeatured: false,
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
        const data = await villagesApi.getNews(selectedVillage, filterStatus || undefined);
        setNewsList(data);
      } catch (err) {
        setError('Gagal mengambil data berita');
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
      excerpt: form.excerpt,
      thumbnailUrl: form.thumbnailUrl,
      authorName: form.authorName,
      category: form.category,
      tags: form.tags,
      status: form.status,
      publishedAt: form.publishedAt || undefined,
      isFeatured: form.isFeatured,
      isPublic: form.isPublic,
    };

    try {
      if (editingId) {
        await villagesApi.updateNews(editingId, data);
        setSuccess('Berita berhasil diperbarui!');
      } else {
        await villagesApi.createNews(data);
        setSuccess('Berita berhasil ditambahkan!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        title: '', content: '', excerpt: '', thumbnailUrl: '',
        authorName: '', category: '', tags: '', status: 'DRAFT',
        publishedAt: '', isFeatured: false, isPublic: true,
      });
      const refreshed = await villagesApi.getNews(selectedVillage, filterStatus || undefined);
      setNewsList(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: News) => {
    setForm({
      title: item.title,
      content: item.content,
      excerpt: item.excerpt || '',
      thumbnailUrl: item.thumbnailUrl || '',
      authorName: item.authorName || '',
      category: item.category || '',
      tags: item.tags || '',
      status: item.status,
      publishedAt: item.publishedAt ? item.publishedAt.split('T')[0] : '',
      isFeatured: item.isFeatured,
      isPublic: item.isPublic,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus berita ini?')) return;
    try {
      await villagesApi.deleteNews(id);
      setSuccess('Berita berhasil dihapus!');
      const refreshed = await villagesApi.getNews(selectedVillage, filterStatus || undefined);
      setNewsList(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus data');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await villagesApi.publishNews(id);
      setSuccess('Berita berhasil dipublikasikan!');
      const refreshed = await villagesApi.getNews(selectedVillage, filterStatus || undefined);
      setNewsList(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mempublikasikan');
    }
  };

  const getStatusInfo = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      DRAFT: { label: '📝 Draft', color: 'badge-gray' },
      PUBLISHED: { label: '📢 Published', color: 'badge-success' },
      ARCHIVED: { label: '📦 Archived', color: 'badge-warning' },
    };
    return labels[status] || { label: status, color: 'badge-gray' };
  };

  const filteredNews = newsList.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.category || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stats = {
    total: newsList.length,
    draft: newsList.filter((n) => n.status === 'DRAFT').length,
    published: newsList.filter((n) => n.status === 'PUBLISHED').length,
    featured: newsList.filter((n) => n.isFeatured).length,
  };

  if (loading && newsList.length === 0 && villages.length === 0) {
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
            <span className="text-4xl">📰</span>
            Berita
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola berita desa ({newsList.length} berita)
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setForm({
                title: '', content: '', excerpt: '', thumbnailUrl: '',
                authorName: '', category: '', tags: '', status: 'DRAFT',
                publishedAt: '', isFeatured: false, isPublic: true,
              });
            }}
            className="btn-primary"
          >
            {showForm ? '✕ Tutup' : '+ Tambah Berita'}
          </button>
        )}
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-gradient bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-white/80 text-xs font-medium">Total Berita</p>
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
        <div className="card-gradient bg-gradient-to-br from-orange-500 to-red-600 text-white">
          <p className="text-white/80 text-xs font-medium">⭐ Featured</p>
          <p className="text-3xl font-bold mt-1">{stats.featured}</p>
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
                  {editingId ? 'Edit Berita' : 'Tambah Berita Baru'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Judul Berita</label>
                  <input
                    type="text"
                    className="input"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Peresmian Jembatan Desa"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Isi Berita</label>
                  <textarea
                    className="input"
                    rows={6}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Tulis isi berita..."
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Ringkasan</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    placeholder="Ringkasan singkat berita..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">URL Thumbnail</label>
                  <input
                    type="text"
                    className="input"
                    value={form.thumbnailUrl}
                    onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <label className="label">Penulis</label>
                  <input
                    type="text"
                    className="input"
                    value={form.authorName}
                    onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Kategori</label>
                  <input
                    type="text"
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Pembangunan, Kesehatan, dll"
                  />
                </div>
                <div>
                  <label className="label">Tags</label>
                  <input
                    type="text"
                    className="input"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="desa, pembangunan (pisah dengan koma)"
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
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    />
                    ⭐ Berita Utama
                  </label>
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
          {newsList.length > 0 && (
            <div className="card">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    className="input pl-12"
                    placeholder="Cari berita..."
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
                      <th>Berita</th>
                      <th>Kategori</th>
                      <th>Views</th>
                      <th>Status</th>
                      <th>Publik</th>
                      {canManage && <th className="text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNews.map((item) => {
                      const statusInfo = getStatusInfo(item.status);
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              {item.thumbnailUrl ? (
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.title}
                                  className="w-12 h-12 rounded-xl object-cover shadow-md"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-xl text-white shadow-md">
                                  📰
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-800 flex items-center gap-2">
                                  {item.isFeatured && <span>⭐</span>}
                                  {item.title}
                                </p>
                                {item.authorName && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    ✍️ {item.authorName}
                                  </p>
                                )}
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
                            <span className="badge-gray">👁️ {item.views}</span>
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
                    {filteredNews.length === 0 && (
                      <tr>
                        <td colSpan={canManage ? 6 : 5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <span className="text-5xl">📰</span>
                            <p className="text-gray-500 font-medium">
                              {searchTerm || filterStatus
                                ? 'Tidak ada berita yang cocok'
                                : 'Belum ada berita'}
                            </p>
                            {canManage && !searchTerm && !filterStatus && (
                              <button
                                onClick={() => setShowForm(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                + Tambah berita pertama
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