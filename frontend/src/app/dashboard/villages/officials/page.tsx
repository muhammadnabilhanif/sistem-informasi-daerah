'use client';

import { useEffect, useState } from 'react';
import { villagesApi, VillageOfficial } from '@/lib/api/villages';
import { regionsApi } from '@/lib/api/regions';

export default function VillageOfficialsPage() {
  const [userRole, setUserRole] = useState('');
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [officials, setOfficials] = useState<VillageOfficial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    position: '',
    positionLevel: 1,
    phone: '',
    email: '',
    startDate: '',
    endDate: '',
    isActive: true,
    isPublic: true,
    orderIndex: 0,
    biography: '',
    photoUrl: '',
  });

  // Fetch daftar desa & cek role
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

  // Fetch officials ketika desa dipilih
  useEffect(() => {
    if (!selectedVillage) return;

    const fetchOfficials = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await villagesApi.getOfficials(selectedVillage);
        setOfficials(data);
      } catch (err) {
        setError('Gagal mengambil data perangkat desa');
      } finally {
        setLoading(false);
      }
    };

    fetchOfficials();
  }, [selectedVillage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const data = {
      villageId: selectedVillage,
      name: form.name,
      position: form.position,
      positionLevel: form.positionLevel,
      phone: form.phone,
      email: form.email,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      isActive: form.isActive,
      isPublic: form.isPublic,
      orderIndex: form.orderIndex,
      biography: form.biography,
      photoUrl: form.photoUrl,
    };

    try {
      if (editingId) {
        await villagesApi.updateOfficial(editingId, data);
        setSuccess('Perangkat desa berhasil diperbarui!');
      } else {
        await villagesApi.createOfficial(data);
        setSuccess('Perangkat desa berhasil ditambahkan!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        name: '',
        position: '',
        positionLevel: 1,
        phone: '',
        email: '',
        startDate: '',
        endDate: '',
        isActive: true,
        isPublic: true,
        orderIndex: 0,
        biography: '',
        photoUrl: '',
      });
      const refreshed = await villagesApi.getOfficials(selectedVillage);
      setOfficials(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (official: VillageOfficial) => {
    setForm({
      name: official.name,
      position: official.position,
      positionLevel: official.positionLevel,
      phone: official.phone || '',
      email: official.email || '',
      startDate: official.startDate.split('T')[0],
      endDate: official.endDate ? official.endDate.split('T')[0] : '',
      isActive: official.isActive,
      isPublic: official.isPublic,
      orderIndex: official.orderIndex,
      biography: official.biography || '',
      photoUrl: official.photoUrl || '',
    });
    setEditingId(official.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus perangkat desa ini?')) return;
    try {
      await villagesApi.deleteOfficial(id);
      setSuccess('Perangkat desa berhasil dihapus!');
      const refreshed = await villagesApi.getOfficials(selectedVillage);
      setOfficials(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus data');
    }
  };

  const getPositionLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: '🔵 Kepala Desa / Lurah',
      2: '🟢 Sekretaris Desa',
      3: '🟡 Kepala Seksi / Kaur',
      4: '🟠 Kepala Dusun / Lingkungan',
      5: '⚪ Perangkat Lainnya',
    };
    return labels[level] || '⚪ Perangkat Lainnya';
  };

  if (loading && officials.length === 0 && villages.length === 0) {
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
            <span className="text-4xl">👔</span>
            Struktur Pemerintahan
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola data perangkat desa ({officials.length} orang)
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setForm({
                name: '', position: '', positionLevel: 1, phone: '', email: '',
                startDate: '', endDate: '', isActive: true, isPublic: true,
                orderIndex: 0, biography: '', photoUrl: '',
              });
            }}
            className="btn-primary"
          >
            {showForm ? '✕ Tutup' : '+ Tambah Perangkat'}
          </button>
        )}
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
                  {editingId ? 'Edit Perangkat Desa' : 'Tambah Perangkat Desa'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nama Lengkap</label>
                  <input type="text" className="input" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Jabatan</label>
                  <input type="text" className="input" value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Tingkat</label>
                  <select className="input" value={form.positionLevel}
                    onChange={(e) => setForm({ ...form, positionLevel: parseInt(e.target.value) })}>
                    <option value={1}>Kepala Desa / Lurah</option>
                    <option value={2}>Sekretaris Desa</option>
                    <option value={3}>Kepala Seksi / Kaur</option>
                    <option value={4}>Kepala Dusun / Lingkungan</option>
                    <option value={5}>Perangkat Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="label">No. Telepon</label>
                  <input type="text" className="input" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Tanggal Mulai</label>
                  <input type="date" className="input" value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Tanggal Selesai (opsional)</label>
                  <input type="date" className="input" value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
                <div>
                  <label className="label">Urutan Tampil</label>
                  <input type="number" className="input" value={form.orderIndex}
                    onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value) })} />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                    Aktif
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isPublic}
                      onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
                    Tampil Publik
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Biografi (opsional)</label>
                  <textarea className="input" rows={2} value={form.biography}
                    onChange={(e) => setForm({ ...form, biography: e.target.value })} />
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
                      <th>Foto</th>
                      <th>Nama</th>
                      <th>Jabatan</th>
                      <th>Tingkat</th>
                      <th>Mulai</th>
                      <th>Status</th>
                      {canManage && <th className="text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {officials.map((official) => (
                      <tr key={official.id}>
                        <td>
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                            {official.name.charAt(0).toUpperCase()}
                          </div>
                        </td>
                        <td className="font-medium text-gray-800">{official.name}</td>
                        <td>
                          <span className="badge-info">{official.position}</span>
                        </td>
                        <td className="text-sm text-gray-600">
                          {getPositionLabel(official.positionLevel)}
                        </td>
                        <td className="text-sm text-gray-600">
                          {new Date(official.startDate).toLocaleDateString('id-ID')}
                        </td>
                        <td>
                          <span className={official.isActive ? 'badge-success' : 'badge-gray'}>
                            {official.isActive ? '● Aktif' : '● Nonaktif'}
                          </span>
                        </td>
                        {canManage && (
                          <td>
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEdit(official)}
                                className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                                title="Edit">
                                ✏️
                              </button>
                              <button onClick={() => handleDelete(official.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                                title="Hapus">
                                🗑️
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {officials.length === 0 && (
                      <tr>
                        <td colSpan={canManage ? 7 : 6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <span className="text-5xl">👔</span>
                            <p className="text-gray-500 font-medium">Belum ada data perangkat desa</p>
                            {canManage && (
                              <button onClick={() => setShowForm(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                + Tambah perangkat pertama
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