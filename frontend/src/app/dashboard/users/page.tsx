'use client';

import { useEffect, useState } from 'react';
import { usersApi, User, UserStats } from '@/lib/api/users';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // ✅ State untuk Modal Wilayah (Fitur Baru)
  const [rws, setRws] = useState<any[]>([]);
  const [rts, setRts] = useState<any[]>([]);
  const [showWilayahModal, setShowWilayahModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRwId, setSelectedRwId] = useState('');
  const [selectedRtId, setSelectedRtId] = useState('');

  // ✅ PERBAIKAN 1: Tambahkan 'gender' di state form
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    phone: '',
    gender: '', // <-- TAMBAHKAN INI
    role: 'CITIZEN',
    isActive: true,
    rtNumber: '',
    rwNumber: '',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        usersApi.getUsers(filterRole || undefined),
        usersApi.getStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fungsi Ambil Data RW & RT
  const fetchWilayah = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const resRw = await fetch(`${API_URL}/regions/rws`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (resRw.ok) setRws(await resRw.json());

      const resRt = await fetch(`${API_URL}/regions/rts`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (resRt.ok) setRts(await resRt.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchWilayah(); // ✅ Panggil data wilayah
  }, [filterRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        ...form,
        villageId: user.villageId,
      };

      if (editingId) {
        await usersApi.updateUser(editingId, payload);
        setSuccess('User berhasil diperbarui!');
      } else {
        await usersApi.createUser(payload);
        setSuccess('User berhasil ditambahkan!');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  // ✅ PERBAIKAN 2: Tambahkan 'gender' di resetForm
  const resetForm = () => {
    setForm({
      email: '',
      name: '',
      password: '',
      phone: '',
      gender: '', // <-- TAMBAHKAN INI
      role: 'CITIZEN',
      isActive: true,
      rtNumber: '',
      rwNumber: '',
    });
  };

  // ✅ PERBAIKAN 3: Tambahkan 'gender' di handleEdit dan perbaiki typo (koma)
  const handleEdit = (user: User) => {
    setForm({
      email: user.email,
      name: user.name,
      password: '',
      phone: user.phone || '',
      gender: (user as any).gender || '', // <-- TAMBAHKAN INI (dengan koma)
      role: user.role,
      isActive: user.isActive,
      rtNumber: '',
      rwNumber: '',
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    try {
      await usersApi.deleteUser(id);
      setSuccess('User berhasil dihapus!');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus data');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordUserId || !newPassword) return;
    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    try {
      await usersApi.changePassword(passwordUserId, newPassword);
      setSuccess('Password berhasil diubah!');
      setShowPasswordModal(false);
      setPasswordUserId(null);
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengubah password');
    }
  };

  // ✅ Fungsi Buka Modal Wilayah
  const handleOpenWilayahModal = (user: any) => {
    setSelectedUser(user);
    setSelectedRwId(user.rwId || '');
    setSelectedRtId(user.rtId || '');
    setShowWilayahModal(true);
  };

  // ✅ Fungsi Simpan Wilayah
  const handleSaveWilayah = async () => {
    try {
      await usersApi.updateUser(selectedUser.id, {
        rwId: selectedRwId,
        rtId: selectedRtId,
      });
      setShowWilayahModal(false);
      fetchUsers();
      setSuccess('Wilayah RT/RW warga berhasil diperbarui!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Gagal menyimpan wilayah');
    }
  };

  const getRoleInfo = (role: string) => {
    const labels: Record<string, { label: string; color: string; icon: string }> = {
      SUPER_ADMIN: { label: 'Super Admin', color: 'badge-danger', icon: '👑' },
      VILLAGE_ADMIN: { label: 'Admin Desa', color: 'badge-info', icon: '🏘️' },
      RT_ADMIN: { label: 'Ketua RT', color: 'badge-warning', icon: '🏠' },
      RW_ADMIN: { label: 'Ketua RW', color: 'badge-purple', icon: '🏙️' },
      CITIZEN: { label: 'Warga', color: 'badge-success', icon: '👤' },
    };
    return labels[role] || { label: role, color: 'badge-gray', icon: '👤' };
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading && users.length === 0) {
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
            <span className="text-4xl">👥</span>
            Manajemen User
          </h1>
          <p className="text-gray-500 mt-1">
            Kelola pengguna sistem ({users.length} user)
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            resetForm();
          }}
          className="btn-primary"
        >
          {showForm ? '✕ Tutup' : '+ Tambah User'}
        </button>
      </div>

      {/* Statistik Cards (Lengkap) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="card-gradient bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-white/80 text-xs font-medium">Total User</p>
            <p className="text-3xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="card-gradient bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <p className="text-white/80 text-xs font-medium">👑 Super Admin</p>
            <p className="text-3xl font-bold mt-1">{stats.superAdmin}</p>
          </div>
          <div className="card-gradient bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
            <p className="text-white/80 text-xs font-medium">🏘️ Admin Desa</p>
            <p className="text-3xl font-bold mt-1">{stats.villageAdmin}</p>
          </div>
          <div className="card-gradient bg-gradient-to-br from-orange-500 to-amber-600 text-white">
            <p className="text-white/80 text-xs font-medium">🏠 Ketua RT</p>
            <p className="text-3xl font-bold mt-1">{stats.rtAdmin || 0}</p>
          </div>
          <div className="card-gradient bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white">
            <p className="text-white/80 text-xs font-medium">🏙️ Ketua RW</p>
            <p className="text-3xl font-bold mt-1">{stats.rwAdmin || 0}</p>
          </div>
          <div className="card-gradient bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <p className="text-white/80 text-xs font-medium">👤 Warga</p>
            <p className="text-3xl font-bold mt-1">{stats.citizen}</p>
          </div>
        </div>
      )}

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

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-xl text-white shadow-lg">
              {editingId ? '✏️' : '➕'}
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editingId ? 'Edit User' : 'Tambah User Baru'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!!editingId}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <label className="label">Nama Lengkap</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama lengkap user"
                required
              />
            </div>
            {!editingId && (
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  required={!editingId}
                />
              </div>
            )}
            <div>
              <label className="label">No. Telepon</label>
              <input
                type="text"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="08xx-xxxx-xxxx"
              />
            </div>

            {/* ✅ PERBAIKAN 4: Dropdown Gender menggunakan state 'form' dengan benar */}
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Jenis Kelamin</label>
              <select
                name="gender"
                value={form.gender || ''}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">-- Pilih --</option>
                <option value="MALE">Laki-laki</option>
                <option value="FEMALE">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="CITIZEN">👤 Warga</option>
                <option value="VILLAGE_ADMIN">🏘️ Admin Desa</option>
                <option value="RT_ADMIN">🏠 Ketua RT</option>
                <option value="RW_ADMIN">🏙️ Ketua RW</option>
                <option value="SUPER_ADMIN">👑 Super Admin</option>
              </select>
            </div>

            {/* ✅ Input Nomor RW & RT */}
            {(form.role === 'RT_ADMIN' || form.role === 'RW_ADMIN') && (
              <div>
                <label className="label">Nomor RW</label>
                <input
                  type="text"
                  className="input"
                  value={form.rwNumber}
                  onChange={(e) => setForm({ ...form, rwNumber: e.target.value })}
                  placeholder="Contoh: 001"
                  required
                />
              </div>
            )}
            {form.role === 'RT_ADMIN' && (
              <div>
                <label className="label">Nomor RT</label>
                <input
                  type="text"
                  className="input"
                  value={form.rtNumber}
                  onChange={(e) => setForm({ ...form, rtNumber: e.target.value })}
                  placeholder="Contoh: 001"
                  required
                />
              </div>
            )}

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Aktif
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
      <div className="card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              className="input pl-12"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input md:w-48"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">Semua Role</option>
            <option value="SUPER_ADMIN">👑 Super Admin</option>
            <option value="VILLAGE_ADMIN">🏘️ Admin Desa</option>
            <option value="RT_ADMIN">🏠 Ketua RT</option>
            <option value="RW_ADMIN">🏙️ Ketua RW</option>
            <option value="CITIZEN">👤 Warga</option>
          </select>
        </div>
      </div>

      {/* Tabel Users */}
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
                  <th>User</th>
                  <th>Role</th>
                  <th className="p-4 font-semibold">WILAYAH</th>
                  <th>Status</th>
                  <th>Terdaftar</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredUsers.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100">{user.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleInfo.color}`}>
                          {roleInfo.icon} {roleInfo.label}
                        </span>
                      </td>

                      {/* ✅ KOLOM WILAYAH BARU */}
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                        {user.role === 'CITIZEN' && 'Warga Desa'}
                        {user.role === 'VILLAGE_ADMIN' && 'Semua Wilayah Desa'}
                        {user.role === 'SUPER_ADMIN' && 'Semua Wilayah'}
                        {user.role === 'RW_ADMIN' && (user.managedRw || 'Belum diatur')}
                        {user.role === 'RT_ADMIN' && (user.managedRt || 'Belum diatur')}
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {user.isActive ? '● Aktif' : '● Nonaktif'}
                        </span>
                      </td>

                      <td className="p-4 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* TOMBOL ATUR WILAYAH (KHUSUS CITIZEN) */}
                          {user.role === 'CITIZEN' && (
                            <button
                              onClick={() => handleOpenWilayahModal(user)}
                              className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                              title="Atur RT/RW"
                            >
                              🏘️
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setPasswordUserId(user.id);
                              setShowPasswordModal(true);
                            }}
                            className="w-8 h-8 rounded-lg bg-yellow-50 hover:bg-yellow-100 flex items-center justify-center transition-colors"
                            title="Ganti Password"
                          >
                            🔑
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* ✅ JIKA DATA KOSONG */}
                {filteredUsers.length === 0 && (
                  <tr>
                    {/* ✅ Perhatikan: colSpan diubah dari 5 menjadi 6 karena ada kolom baru */}
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-5xl">👥</span>
                        <p className="text-gray-500 font-medium">
                          {searchTerm || filterRole
                            ? 'Tidak ada user yang cocok'
                            : 'Belum ada user'}
                        </p>
                        {!searchTerm && !filterRole && (
                          <button
                            onClick={() => setShowForm(true)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            + Tambah user pertama
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

      {/* Modal Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-lg">
                🔑
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Ganti Password</h3>
                <p className="text-sm text-gray-500">Masukkan password baru</p>
              </div>
            </div>
            <div className="mb-6">
              <label className="label">Password Baru</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleChangePassword} className="btn-primary flex-1">
                💾 Simpan
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordUserId(null);
                  setNewPassword('');
                }}
                className="btn-secondary"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL ATUR WILAYAH WARGA (FITUR BARU) */}
      {showWilayahModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-bold mb-4">Atur Wilayah Warga</h3>
            <p className="text-sm text-gray-500 mb-4">
              Nama: <strong>{selectedUser.name}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pilih RW</label>
                <select
                  className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  value={selectedRwId}
                  onChange={(e) => {
                    setSelectedRwId(e.target.value);
                    setSelectedRtId(''); // Reset RT saat RW berubah
                  }}
                >
                  <option value="">-- Pilih RW --</option>
                  {rws.map((rw) => (
                    <option key={rw.id} value={rw.id}>RW {rw.number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pilih RT</label>
                <select
                  className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  value={selectedRtId}
                  onChange={(e) => setSelectedRtId(e.target.value)}
                  disabled={!selectedRwId}
                >
                  <option value="">-- Pilih RT --</option>
                  {rts.filter(rt => rt.rwId === selectedRwId).map((rt) => (
                    <option key={rt.id} value={rt.id}>RT {rt.number}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleSaveWilayah} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex-1 font-medium">Simpan</button>
              <button onClick={() => setShowWilayahModal(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );  
}