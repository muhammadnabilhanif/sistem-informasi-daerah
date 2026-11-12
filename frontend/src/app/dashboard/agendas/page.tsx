'use client';

import { useEffect, useState } from 'react';
import { villagesApi, Agenda } from '@/lib/api/villages';
import { regionsApi } from '@/lib/api/regions';

export default function AgendasPage() {
  const [userRole, setUserRole] = useState('');
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [agendas, setAgendas] = useState<Agenda[]>([]);
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
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    startDatetime: '',
    endDatetime: '',
    category: '',
    organizer: '',
    status: 'UPCOMING',
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
        const data = await villagesApi.getAgendas(selectedVillage, filterStatus || undefined);
        setAgendas(data);
      } catch (err) {
        setError('Gagal mengambil data agenda');
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
      description: form.description,
      location: form.location,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      startDatetime: form.startDatetime,
      endDatetime: form.endDatetime || undefined,
      category: form.category,
      organizer: form.organizer,
      status: form.status,
      isPublic: form.isPublic,
    };

    try {
      if (editingId) {
        await villagesApi.updateAgenda(editingId, data);
        setSuccess('Agenda berhasil diperbarui!');
      } else {
        await villagesApi.createAgenda(data);
        setSuccess('Agenda berhasil ditambahkan!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        title: '', description: '', location: '', latitude: '', longitude: '',
        startDatetime: '', endDatetime: '', category: '', organizer: '',
        status: 'UPCOMING', isPublic: true,
      });
      const refreshed = await villagesApi.getAgendas(selectedVillage, filterStatus || undefined);
      setAgendas(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: Agenda) => {
    setForm({
      title: item.title,
      description: item.description || '',
      location: item.location || '',
      latitude: item.latitude?.toString() || '',
      longitude: item.longitude?.toString() || '',
      startDatetime: item.startDatetime ? item.startDatetime.slice(0, 16) : '',
      endDatetime: item.endDatetime ? item.endDatetime.slice(0, 16) : '',
      category: item.category || '',
      organizer: item.organizer || '',
      status: item.status,
      isPublic: item.isPublic,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus agenda ini?')) return;
    try {
      await villagesApi.deleteAgenda(id);
      setSuccess('Agenda berhasil dihapus!');
      const refreshed = await villagesApi.getAgendas(selectedVillage, filterStatus || undefined);
      setAgendas(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus data');
    }
  };

  const getStatusInfo = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      UPCOMING: { label: '📅 Akan Datang', color: 'badge-info' },
      ONGOING: { label: '🔄 Berlangsung', color: 'badge-success' },
      COMPLETED: { label: '✅ Selesai', color: 'badge-gray' },
      CANCELLED: { label: '❌ Dibatalkan', color: 'badge-danger' },
    };
    return labels[status] || { label: status, color: 'badge-gray' };
  };

  const formatDateTime = (datetime: string) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const filtered = agendas.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.location || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stats = {
    total: agendas.length,
    upcoming: agendas.filter((a) => a.status === 'UPCOMING').length,
    ongoing: agendas.filter((a) => a.status === 'ONGOING').length,
    completed: agendas.filter((a) => a.status === 'COMPLETED').length,
  };

  if (loading && agendas.length === 0 && villages.length === 0) {
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
            <span className="text-4xl">📅</span>
            Agenda
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola agenda desa ({agendas.length} agenda)
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setForm({
                title: '', description: '', location: '', latitude: '', longitude: '',
                startDatetime: '', endDatetime: '', category: '', organizer: '',
                status: 'UPCOMING', isPublic: true,
              });
            }}
            className="btn-primary"
          >
            {showForm ? '✕ Tutup' : '+ Tambah Agenda'}
          </button>
        )}
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-gradient bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-white/80 text-xs font-medium">Total Agenda</p>
          <p className="text-3xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="card-gradient bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
          <p className="text-white/80 text-xs font-medium">📅 Akan Datang</p>
          <p className="text-3xl font-bold mt-1">{stats.upcoming}</p>
        </div>
        <div className="card-gradient bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <p className="text-white/80 text-xs font-medium">🔄 Berlangsung</p>
          <p className="text-3xl font-bold mt-1">{stats.ongoing}</p>
        </div>
        <div className="card-gradient bg-gradient-to-br from-gray-500 to-gray-600 text-white">
          <p className="text-white/80 text-xs font-medium">✅ Selesai</p>
          <p className="text-3xl font-bold mt-1">{stats.completed}</p>
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
                  {editingId ? 'Edit Agenda' : 'Tambah Agenda Baru'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Judul Agenda</label>
                  <input
                    type="text"
                    className="input"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Rapat Desa Bulanan"
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
                    placeholder="Deskripsi agenda..."
                  />
                </div>
                <div>
                  <label className="label">Lokasi</label>
                  <input
                    type="text"
                    className="input"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Balai Desa, Aula, dll"
                  />
                </div>
                <div>
                  <label className="label">Kategori</label>
                  <input
                    type="text"
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Rapat, Sosialisasi, dll"
                  />
                </div>
                <div>
                  <label className="label">Tanggal & Waktu Mulai</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.startDatetime}
                    onChange={(e) => setForm({ ...form, startDatetime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Tanggal & Waktu Selesai</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.endDatetime}
                    onChange={(e) => setForm({ ...form, endDatetime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Penyelenggara</label>
                  <input
                    type="text"
                    className="input"
                    value={form.organizer}
                    onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                    placeholder="Nama penyelenggara"
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="UPCOMING">📅 Akan Datang</option>
                    <option value="ONGOING">🔄 Berlangsung</option>
                    <option value="COMPLETED">✅ Selesai</option>
                    <option value="CANCELLED">❌ Dibatalkan</option>
                  </select>
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
          {agendas.length > 0 && (
            <div className="card">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    className="input pl-12"
                    placeholder="Cari agenda..."
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
                  <option value="UPCOMING">📅 Akan Datang</option>
                  <option value="ONGOING">🔄 Berlangsung</option>
                  <option value="COMPLETED">✅ Selesai</option>
                  <option value="CANCELLED">❌ Dibatalkan</option>
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
                      <th>Agenda</th>
                      <th>Lokasi</th>
                      <th>Waktu</th>
                      <th>Status</th>
                      <th>Publik</th>
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
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xl text-white shadow-md">
                                📅
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{item.title}</p>
                                {item.category && (
                                  <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            {item.location ? (
                              <span className="text-sm text-gray-600">📍 {item.location}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td>
                            <span className="text-sm text-gray-600">
                              {formatDateTime(item.startDatetime)}
                            </span>
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
                            <span className="text-5xl">📅</span>
                            <p className="text-gray-500 font-medium">
                              {searchTerm || filterStatus
                                ? 'Tidak ada agenda yang cocok'
                                : 'Belum ada agenda'}
                            </p>
                            {canManage && !searchTerm && !filterStatus && (
                              <button
                                onClick={() => setShowForm(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                + Tambah agenda pertama
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