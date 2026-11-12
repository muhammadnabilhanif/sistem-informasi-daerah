'use client';

import { useEffect, useState } from 'react';
import { villagesApi, VillageProfile } from '@/lib/api/villages';
import { regionsApi } from '@/lib/api/regions';

export default function VillageProfilePage() {
  const [userRole, setUserRole] = useState('');
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [profile, setProfile] = useState<VillageProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    description: '', history: '', vision: '', mission: '', motto: '',
    address: '', phone: '', email: '', website: '',
    latitude: '', longitude: '', totalAreaKm2: '', landAreaKm2: '', waterAreaKm2: '',
    northBoundary: '', southBoundary: '', westBoundary: '', eastBoundary: '',
    status: 'DRAFT',
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

  useEffect(() => {
    if (!selectedVillage) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await villagesApi.getProfile(selectedVillage);
        setProfile(data);
        setForm({
          description: data.description || '',
          history: data.history || '',
          vision: data.vision || '',
          mission: data.mission || '',
          motto: data.motto || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
          totalAreaKm2: data.totalAreaKm2?.toString() || '',
          landAreaKm2: data.landAreaKm2?.toString() || '',
          waterAreaKm2: data.waterAreaKm2?.toString() || '',
          northBoundary: data.northBoundary || '',
          southBoundary: data.southBoundary || '',
          westBoundary: data.westBoundary || '',
          eastBoundary: data.eastBoundary || '',
          status: data.status || 'DRAFT',
        });
        setIsEditing(false);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setProfile(null);
          setIsEditing(true);
        } else {
          setError('Gagal mengambil profil desa');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [selectedVillage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const data = {
      villageId: selectedVillage,
      description: form.description,
      history: form.history,
      vision: form.vision,
      mission: form.mission,
      motto: form.motto,
      address: form.address,
      phone: form.phone,
      email: form.email,
      website: form.website,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      totalAreaKm2: form.totalAreaKm2 ? parseFloat(form.totalAreaKm2) : undefined,
      landAreaKm2: form.landAreaKm2 ? parseFloat(form.landAreaKm2) : undefined,
      waterAreaKm2: form.waterAreaKm2 ? parseFloat(form.waterAreaKm2) : undefined,
      northBoundary: form.northBoundary,
      southBoundary: form.southBoundary,
      westBoundary: form.westBoundary,
      eastBoundary: form.eastBoundary,
      status: form.status,
    };

    try {
      if (profile) {
        await villagesApi.updateProfile(selectedVillage, data);
        setSuccess('Profil berhasil diperbarui!');
      } else {
        await villagesApi.createProfile(data);
        setSuccess('Profil berhasil dibuat!');
      }
      setIsEditing(false);
      const refreshed = await villagesApi.getProfile(selectedVillage);
      setProfile(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const canEdit = userRole === 'SUPER_ADMIN' || userRole === 'VILLAGE_ADMIN';
  const selectedVillageName = villages.find((v) => v.id === selectedVillage)?.name || '';

  if (loading && !profile && villages.length === 0) {
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
            <span className="text-4xl">🏘️</span>
            Profil Desa/Kelurahan
          </h1>
          <p className="text-gray-500 mt-1">Kelola informasi profil desa</p>
        </div>
        {canEdit && profile && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-primary">
            ✏️ Edit Profil
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
          {loading ? (
            <div className="card">
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : isEditing || !profile ? (
            <form onSubmit={handleSubmit} className="card space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-xl text-white shadow-lg">
                  {profile ? '✏️' : '➕'}
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  {profile ? 'Edit Profil Desa' : 'Buat Profil Desa'}
                </h2>
              </div>

              {/* Informasi Utama */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📝 Informasi Utama
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Deskripsi</label>
                    <textarea className="input" rows={3} value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Deskripsi singkat tentang desa..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Sejarah</label>
                    <textarea className="input" rows={3} value={form.history}
                      onChange={(e) => setForm({ ...form, history: e.target.value })}
                      placeholder="Sejarah desa..." />
                  </div>
                  <div>
                    <label className="label">Visi</label>
                    <textarea className="input" rows={2} value={form.vision}
                      onChange={(e) => setForm({ ...form, vision: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Misi</label>
                    <textarea className="input" rows={2} value={form.mission}
                      onChange={(e) => setForm({ ...form, mission: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Motto</label>
                    <input className="input" value={form.motto}
                      onChange={(e) => setForm({ ...form, motto: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="DRAFT">📝 Draft</option>
                      <option value="PUBLISHED">📢 Published</option>
                      <option value="ARCHIVED">📦 Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Kontak */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📞 Kontak & Alamat
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Alamat</label>
                    <input className="input" value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Telepon</label>
                    <input className="input" value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input className="input" type="email" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Website</label>
                    <input className="input" value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Aksi */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button type="submit" disabled={saving} className="btn-success">
                  {saving ? '💾 Menyimpan...' : '💾 Simpan Profil'}
                </button>
                {profile && (
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
                    Batal
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="card-gradient bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <div className="text-3xl mb-2">📍</div>
                  <p className="text-white/80 text-sm">Alamat</p>
                  <p className="text-lg font-semibold mt-1">{profile.address || '-'}</p>
                </div>
                <div className="card-gradient bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <div className="text-3xl mb-2">📞</div>
                  <p className="text-white/80 text-sm">Telepon</p>
                  <p className="text-lg font-semibold mt-1">{profile.phone || '-'}</p>
                </div>
                <div className="card-gradient bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-white/80 text-sm">Status</p>
                  <p className="text-lg font-semibold mt-1">{profile.status}</p>
                </div>
              </div>

              {/* Detail Content */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  🎯 Visi & Misi
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                    <p className="text-sm font-semibold text-blue-700 mb-2">Visi</p>
                    <p className="text-gray-700">{profile.vision || 'Belum diisi'}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border-l-4 border-green-500">
                    <p className="text-sm font-semibold text-green-700 mb-2">Misi</p>
                    <p className="text-gray-700">{profile.mission || 'Belum diisi'}</p>
                  </div>
                </div>
              </div>

              {profile.description && (
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    📝 Deskripsi
                  </h2>
                  <p className="text-gray-700 leading-relaxed">{profile.description}</p>
                </div>
              )}

              {profile.history && (
                <div className="card">
                  <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    📚 Sejarah
                  </h2>
                  <p className="text-gray-700 leading-relaxed">{profile.history}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}