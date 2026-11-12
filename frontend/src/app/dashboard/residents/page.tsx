'use client';

import { useEffect, useState } from 'react';
import { villagesApi, ResidentStatistic } from '@/lib/api/villages';
import { regionsApi } from '@/lib/api/regions';

export default function ResidentsPage() {
  const [userRole, setUserRole] = useState('');
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [statistics, setStatistics] = useState<ResidentStatistic[]>([]);
  const [latestStat, setLatestStat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    semester: 1,
    totalPopulation: 0,
    maleCount: 0,
    femaleCount: 0,
    totalHouseholds: 0,
    totalFamilies: 0,
    dataSource: '',
    notes: '',
    age0to5: 0, age6to12: 0, age13to17: 0, age18to25: 0,
    age26to40: 0, age41to60: 0, age60plus: 0,
    eduSD: 0, eduSMP: 0, eduSMA: 0, eduD3: 0, eduS1: 0, eduS2: 0,
    occPetani: 0, occBuruh: 0, occPedagang: 0, occPNS: 0,
    occKaryawan: 0, occWiraswasta: 0, occLainnya: 0,
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
        const [allData, latest] = await Promise.all([
          villagesApi.getResidentStatistics(selectedVillage),
          villagesApi.getLatestResidentStatistics(selectedVillage),
        ]);
        setStatistics(allData);
        setLatestStat(latest);
      } catch (err) {
        setError('Gagal mengambil data statistik');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedVillage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (form.maleCount + form.femaleCount !== form.totalPopulation) {
      setError('Jumlah laki-laki + perempuan harus sama dengan total penduduk');
      setSaving(false);
      return;
    }

    const data = {
      villageId: selectedVillage,
      year: form.year,
      semester: form.semester,
      totalPopulation: form.totalPopulation,
      maleCount: form.maleCount,
      femaleCount: form.femaleCount,
      totalHouseholds: form.totalHouseholds,
      totalFamilies: form.totalFamilies,
      dataSource: form.dataSource,
      notes: form.notes,
      ageGroups: {
        '0-5': form.age0to5, '6-12': form.age6to12, '13-17': form.age13to17,
        '18-25': form.age18to25, '26-40': form.age26to40,
        '41-60': form.age41to60, '60+': form.age60plus,
      },
      educationStats: {
        SD: form.eduSD, SMP: form.eduSMP, SMA: form.eduSMA,
        D3: form.eduD3, S1: form.eduS1, S2: form.eduS2,
      },
      occupationStats: {
        Petani: form.occPetani, Buruh: form.occBuruh,
        Pedagang: form.occPedagang, PNS: form.occPNS,
        Karyawan: form.occKaryawan, Wiraswasta: form.occWiraswasta,
        Lainnya: form.occLainnya,
      },
    };

    try {
      if (editingId) {
        await villagesApi.updateResidentStatistic(editingId, data);
        setSuccess('Statistik berhasil diperbarui!');
      } else {
        await villagesApi.createResidentStatistic(data);
        setSuccess('Statistik berhasil ditambahkan!');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      const [allData, latest] = await Promise.all([
        villagesApi.getResidentStatistics(selectedVillage),
        villagesApi.getLatestResidentStatistics(selectedVillage),
      ]);
      setStatistics(allData);
      setLatestStat(latest);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      year: new Date().getFullYear(), semester: 1,
      totalPopulation: 0, maleCount: 0, femaleCount: 0,
      totalHouseholds: 0, totalFamilies: 0, dataSource: '', notes: '',
      age0to5: 0, age6to12: 0, age13to17: 0, age18to25: 0,
      age26to40: 0, age41to60: 0, age60plus: 0,
      eduSD: 0, eduSMP: 0, eduSMA: 0, eduD3: 0, eduS1: 0, eduS2: 0,
      occPetani: 0, occBuruh: 0, occPedagang: 0, occPNS: 0,
      occKaryawan: 0, occWiraswasta: 0, occLainnya: 0,
    });
  };

  const handleEdit = (item: ResidentStatistic) => {
    const ageGroups = (item.ageGroups as any) || {};
    const educationStats = (item.educationStats as any) || {};
    const occupationStats = (item.occupationStats as any) || {};

    setForm({
      year: item.year, semester: item.semester,
      totalPopulation: item.totalPopulation, maleCount: item.maleCount,
      femaleCount: item.femaleCount, totalHouseholds: item.totalHouseholds,
      totalFamilies: item.totalFamilies, dataSource: item.dataSource || '',
      notes: item.notes || '',
      age0to5: ageGroups['0-5'] || 0, age6to12: ageGroups['6-12'] || 0,
      age13to17: ageGroups['13-17'] || 0, age18to25: ageGroups['18-25'] || 0,
      age26to40: ageGroups['26-40'] || 0, age41to60: ageGroups['41-60'] || 0,
      age60plus: ageGroups['60+'] || 0,
      eduSD: educationStats.SD || 0, eduSMP: educationStats.SMP || 0,
      eduSMA: educationStats.SMA || 0, eduD3: educationStats.D3 || 0,
      eduS1: educationStats.S1 || 0, eduS2: educationStats.S2 || 0,
      occPetani: occupationStats.Petani || 0, occBuruh: occupationStats.Buruh || 0,
      occPedagang: occupationStats.Pedagang || 0, occPNS: occupationStats.PNS || 0,
      occKaryawan: occupationStats.Karyawan || 0,
      occWiraswasta: occupationStats.Wiraswasta || 0,
      occLainnya: occupationStats.Lainnya || 0,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data statistik ini?')) return;
    try {
      await villagesApi.deleteResidentStatistic(id);
      setSuccess('Statistik berhasil dihapus!');
      const [allData, latest] = await Promise.all([
        villagesApi.getResidentStatistics(selectedVillage),
        villagesApi.getLatestResidentStatistics(selectedVillage),
      ]);
      setStatistics(allData);
      setLatestStat(latest);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menghapus data');
    }
  };

  const pageTitle = canManage ? '📊 Data Penduduk' : '📊 Statistik Penduduk';

  const summaryData = latestStat ? [
    { title: 'Total Penduduk', value: latestStat.totalPopulation || 0, icon: '👥', gradient: 'from-blue-500 to-blue-600' },
    { title: 'Laki-laki', value: latestStat.maleCount || 0, icon: '👨', gradient: 'from-green-500 to-green-600' },
    { title: 'Perempuan', value: latestStat.femaleCount || 0, icon: '👩', gradient: 'from-pink-500 to-pink-600' },
    { title: 'Kepala Keluarga', value: latestStat.totalHouseholds || 0, icon: '🏠', gradient: 'from-purple-500 to-purple-600' },
  ] : [];

  if (loading && statistics.length === 0 && villages.length === 0) {
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
            <span className="text-4xl">📊</span>
            {pageTitle.replace('📊 ', '')}
          </h1>
          <p className="text-gray-500 mt-1">
            {canManage ? 'Kelola data penduduk desa' : 'Statistik penduduk desa Anda'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              resetForm();
            }}
            className="btn-primary"
          >
            {showForm ? '✕ Tutup' : '+ Tambah Data Statistik'}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {summaryData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {summaryData.map((card) => (
            <div
              key={card.title}
              className={`card-gradient bg-gradient-to-br ${card.gradient} text-white`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                </div>
                <div className="text-3xl opacity-80">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                  {editingId ? 'Edit Statistik' : 'Tambah Statistik Baru'}
                </h2>
              </div>

              {/* Tahun & Sumber */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  📅 Periode Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Tahun</label>
                    <input type="number" className="input" value={form.year}
                      onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} required />
                  </div>
                  <div>
                    <label className="label">Semester</label>
                    <select className="input" value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}>
                      <option value={1}>Semester 1</option>
                      <option value={2}>Semester 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Sumber Data</label>
                    <input type="text" className="input" value={form.dataSource}
                      onChange={(e) => setForm({ ...form, dataSource: e.target.value })}
                      placeholder="Dukcapil, Survey, dll" />
                  </div>
                </div>
              </div>

              {/* Total Penduduk */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  👥 Total Penduduk
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Total Penduduk</label>
                    <input type="number" className="input" value={form.totalPopulation}
                      onChange={(e) => setForm({ ...form, totalPopulation: parseInt(e.target.value) || 0 })} required />
                  </div>
                  <div>
                    <label className="label">Laki-laki</label>
                    <input type="number" className="input" value={form.maleCount}
                      onChange={(e) => setForm({ ...form, maleCount: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="label">Perempuan</label>
                    <input type="number" className="input" value={form.femaleCount}
                      onChange={(e) => setForm({ ...form, femaleCount: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="label">Kepala Keluarga</label>
                    <input type="number" className="input" value={form.totalHouseholds}
                      onChange={(e) => setForm({ ...form, totalHouseholds: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="label">Total Keluarga</label>
                    <input type="number" className="input" value={form.totalFamilies}
                      onChange={(e) => setForm({ ...form, totalFamilies: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>

              {/* Kelompok Umur */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  🎂 Kelompok Umur
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'age0to5', label: '0-5 tahun' },
                    { key: 'age6to12', label: '6-12 tahun' },
                    { key: 'age13to17', label: '13-17 tahun' },
                    { key: 'age18to25', label: '18-25 tahun' },
                    { key: 'age26to40', label: '26-40 tahun' },
                    { key: 'age41to60', label: '41-60 tahun' },
                    { key: 'age60plus', label: '60+ tahun' },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="label">{item.label}</label>
                      <input type="number" className="input" value={(form as any)[item.key]}
                        onChange={(e) => setForm({ ...form, [item.key]: parseInt(e.target.value) || 0 })} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pendidikan */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  🎓 Pendidikan
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'eduSD', label: 'SD' },
                    { key: 'eduSMP', label: 'SMP' },
                    { key: 'eduSMA', label: 'SMA/SMK' },
                    { key: 'eduD3', label: 'D3' },
                    { key: 'eduS1', label: 'S1' },
                    { key: 'eduS2', label: 'S2/S3' },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="label">{item.label}</label>
                      <input type="number" className="input" value={(form as any)[item.key]}
                        onChange={(e) => setForm({ ...form, [item.key]: parseInt(e.target.value) || 0 })} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pekerjaan */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  💼 Pekerjaan
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'occPetani', label: 'Petani' },
                    { key: 'occBuruh', label: 'Buruh' },
                    { key: 'occPedagang', label: 'Pedagang' },
                    { key: 'occPNS', label: 'PNS/TNI/Polri' },
                    { key: 'occKaryawan', label: 'Karyawan Swasta' },
                    { key: 'occWiraswasta', label: 'Wiraswasta' },
                    { key: 'occLainnya', label: 'Lainnya' },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="label">{item.label}</label>
                      <input type="number" className="input" value={(form as any)[item.key]}
                        onChange={(e) => setForm({ ...form, [item.key]: parseInt(e.target.value) || 0 })} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label">Catatan</label>
                <textarea className="input" rows={2} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
                      <th>Tahun</th>
                      <th>Semester</th>
                      <th>Total</th>
                      <th>Laki-laki</th>
                      <th>Perempuan</th>
                      {canManage && <th className="text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium text-gray-800">{item.year}</td>
                        <td>
                          <span className="badge-info">Semester {item.semester}</span>
                        </td>
                        <td>
                          <span className="font-bold text-blue-600">{item.totalPopulation}</span>
                        </td>
                        <td>
                          <span className="font-semibold text-green-600">{item.maleCount}</span>
                        </td>
                        <td>
                          <span className="font-semibold text-pink-600">{item.femaleCount}</span>
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
                    ))}
                    {statistics.length === 0 && (
                      <tr>
                        <td colSpan={canManage ? 6 : 5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <span className="text-5xl">📊</span>
                            <p className="text-gray-500 font-medium">
                              Belum ada data statistik
                            </p>
                            {canManage && (
                              <button
                                onClick={() => setShowForm(true)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                + Tambah data pertama
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