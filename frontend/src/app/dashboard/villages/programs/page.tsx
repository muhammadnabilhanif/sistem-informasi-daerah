'use client';

import { useEffect, useState } from 'react';
import { villagesApi, VillageProgram } from '@/lib/api/villages';
import { regionsApi } from '@/lib/api/regions';

export default function VillageProgramsPage() {
  const [userRole, setUserRole] = useState('');
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [programs, setPrograms] = useState<VillageProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    status: 'PLANNING',
    startDate: '',
    endDate: '',
    isPublic: true,
  });

  // Fetch role & desa
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

  // Fetch programs
  useEffect(() => {
    if (!selectedVillage) return;

    const fetchPrograms = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await villagesApi.getPrograms(selectedVillage);
        setPrograms(data);
      } catch (err) {
        setError('Gagal mengambil data program kerja');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [selectedVillage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const data = {
      villageId: selectedVillage,
      title: form.title,
      description: form.description,
      category: form.category,
      budget: form.budget ? parseFloat(form.budget) : undefined,
      status: form.status,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      isPublic: form.isPublic,
    };

    try {
      if (editingId) {
        await villagesApi.updateProgram(editingId, data);
        setSuccess('Program berhasil diperbarui!');
      } else {
        await villagesApi.createProgram(data);
        setSuccess('Program berhasil ditambahkan!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        title: '', description: '', category: '', budget: '',
        status: 'PLANNING', startDate: '', endDate: '', isPublic: true,
      });
      const refreshed = await villagesApi.getPrograms(selectedVillage);
      setPrograms(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (program: VillageProgram) => {
    setForm({
      title: program.title,
      description: program.description || '',
      category: program.category || '',
      budget: program.budget?.toString() || '',
      status: program.status,
      startDate: program.startDate ? program.startDate.split('T')[0] : '',
      endDate: program.endDate ? program.endDate.split('T')[0] : '',
      isPublic: program.isPublic,
    });
    setEditingId(program.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus program ini?')) return;
    try {
      await villagesApi.deleteProgram(id);
      setSuccess('Program berhasil dihapus!');
      const refreshed = await villagesApi.getPrograms(selectedVillage);
      setPrograms(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus data');
    }
  };

  const getStatusInfo = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      PLANNING: { label: '📋 Perencanaan', color: 'badge-info' },
      ONGOING: { label: '🔄 Berjalan', color: 'badge-success' },
      COMPLETED: { label: '✅ Selesai', color: 'badge-gray' },
      CANCELLED: { label: '❌ Dibatalkan', color: 'badge-danger' },
    };
    return labels[status] || { label: status, color: 'badge-gray' };
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredPrograms = programs.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStats = () => {
    return {
      total: programs.length,
      planning: programs.filter((p) => p.status === 'PLANNING').length,
      ongoing: programs.filter((p) => p.status === 'ONGOING').length,
      completed: programs.filter((p) => p.status === 'COMPLETED').length,
    };
  };

  if (loading && programs.length === 0 && villages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton"></div>
        <div className="h-96 skeleton"></div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">📋</span>
            Program Kerja Desa
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola program kerja desa ({programs.length} program)
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setForm({
                title: '', description: '', category: '', budget: '',
                status: 'PLANNING', startDate: '', endDate: '', isPublic: true,
              });
            }}
            className="btn-primary"
          >
            {showForm ? '✕ Tutup' : '+ Tambah Program'}
          </button>
        )}
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-gradient bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-white/80 text-xs font-medium">Total Program</p>
          <p className="text-3xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="card-gradient bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
          <p className="text-white/80 text-xs font-medium">📋 Perencanaan</p>
          <p className="text-3xl font-bold mt-1">{stats.planning}</p>
        </div>
        <div className="card-gradient bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <p className="text-white/80 text-xs font-medium">🔄 Berjalan</p>
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
                  {editingId ? 'Edit Program' : 'Tambah Program Baru'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Judul Program</label>
                  <input type="text" className="input" value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Contoh: Pembangunan Jembatan Desa"
                    required />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Deskripsi</label>
                  <textarea className="input" rows={3} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Deskripsi program..." />
                </div>
                <div>
                  <label className="label">Kategori</label>
                  <input type="text" className="input" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Infrastruktur, Pendidikan, dll" />
                </div>
                <div>
                  <label className="label">Anggaran (Rp)</label>
                  <input type="number" className="input" value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="1000000" />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="PLANNING">📋 Perencanaan</option>
                    <option value="ONGOING">🔄 Berjalan</option>
                    <option value="COMPLETED">✅ Selesai</option>
                    <option value="CANCELLED">❌ Dibatalkan</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isPublic}
                      onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
                    Tampilkan ke Publik
                  </label>
                </div>
                <div>
                  <label className="label">Tanggal Mulai</label>
                  <input type="date" className="input" value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">Tanggal Selesai</label>
                  <input type="date" className="input" value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button type="submit" disabled={saving} className="btn-success">
                  {saving ? '💾 Menyimpan...' : '💾 Simpan'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Batal
                </button>
              </div>
            </form>
          )}

          {/* Search & Filter */}
          {programs.length > 0 && (
            <div className="card">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    className="input pl-12"
                    placeholder="Cari program..."
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
                  <option value="PLANNING">📋 Perencanaan</option>
                  <option value="ONGOING">🔄 Berjalan</option>
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
                      <th>Program</th>
                      <th>Kategori</th>
                      <th>Anggaran</th>
                      <th>Status</th>
                      <th>Publik</th>
                      {canManage && <th className="text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrograms.map((program) => {
                      const statusInfo = getStatusInfo(program.status);
                      return (
                        <tr key={program.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-xl text-white shadow-md">
                                📋
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{program.title}</p>
                                {program.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                    {program.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            {program.category ? (
                              <span className="badge-info">{program.category}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td>
                            <span className="font-semibold text-gray-700">
                              {formatCurrency(program.budget)}
                            </span>
                          </td>
                          <td>
                            <span className={statusInfo.color}>{statusInfo.label}</span>
                          </td>
                          <td>
                            <span className={program.isPublic ? 'text-green-500' : 'text-gray-400'}>
                              {program.isPublic ? '✅' : '🔒'}
                            </span>
                          </td>
                          {canManage && (
                            <td>
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleEdit(program)}
                                  className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                                  title="Edit">
                                  ✏️
                                </button>
                                <button onClick={() => handleDelete(program.id)}
                                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                                  title="Hapus">
                                  🗑️
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {filteredPrograms.length === 0 && (
                      <tr>
                        <td colSpan={canManage ? 6 : 5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <span className="text-5xl">📭</span>
                            <p className="text-gray-500 font-medium">
                              {searchTerm || filterStatus
                                ? 'Tidak ada program yang cocok'
                                : 'Belum ada program kerja'}
                            </p>
                            {canManage && !searchTerm && !filterStatus && (
                              <button onClick={() => setShowForm(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                + Tambah program pertama
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