'use client';

import { useEffect, useState } from 'react';
import { showConfirm, showSuccess, showError } from '@/lib/swal';

type TabType = 'provinces' | 'regencies' | 'districts' | 'villages';

export default function ManageRegionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('provinces');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State untuk menyimpan data induk (untuk dropdown form)
  const [provincesList, setProvincesList] = useState<any[]>([]);
  const [regenciesList, setRegenciesList] = useState<any[]>([]);
  const [districtsList, setDistrictsList] = useState<any[]>([]);

  // State Form & Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('WebMCP');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${API_URL}/regions/${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
    } catch (error) {
      showError('Gagal', 'Gagal mengambil data wilayah');
    } finally {
      setLoading(false);
    }
  };

  // Ambil data induk untuk kebutuhan dropdown (hanya saat modal dibuka)
  const fetchIndukData = async () => {
    try {
      const token = getToken();
      const [resProv, resReg, resDist] = await Promise.all([
        fetch(`${API_URL}/regions/provinces`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/regions/regencies`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/regions/districts`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resProv.ok) setProvincesList(await resProv.json());
      if (resReg.ok) setRegenciesList(await resReg.json());
      if (resDist.ok) setDistrictsList(await resDist.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- HANDLERS ---
  const handleOpenAdd = () => {
    setEditId(null);
    setForm({});
    fetchIndukData(); // Pastikan data induk terbaru terambil untuk dropdown
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditId(item.id);
    setForm({ ...item });
    fetchIndukData();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getToken();
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `${API_URL}/regions/${activeTab}/${editId}` : `${API_URL}/regions/${activeTab}`;

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal menyimpan data');

      showSuccess('Berhasil!', `Data ${activeTab} berhasil disimpan.`);
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      showError('Gagal', error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm('Hapus Data?', 'Data yang dihapus tidak dapat dikembalikan.');
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/regions/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      showSuccess('Berhasil!', 'Data berhasil dihapus.');
      fetchData();
    } catch (error: any) {
      showError('Gagal', error.message);
    }
  };

  // --- RENDER TABLE HEADER BERDASARKAN TAB ---
  const renderTableHeader = () => {
    switch (activeTab) {
      case 'provinces':
        return (
          <tr>
            <th className="p-4 font-semibold">Kode</th>
            <th className="p-4 font-semibold">Nama Provinsi</th>
            <th className="p-4 font-semibold">Ibu Kota</th>
            <th className="p-4 font-semibold text-center">Aksi</th>
          </tr>
        );
      case 'regencies':
        return (
          <tr>
            <th className="p-4 font-semibold">Kode</th>
            <th className="p-4 font-semibold">Nama Kab/Kota</th>
            <th className="p-4 font-semibold">Provinsi</th>
            <th className="p-4 font-semibold text-center">Aksi</th>
          </tr>
        );
      case 'districts':
        return (
          <tr>
            <th className="p-4 font-semibold">Kode</th>
            <th className="p-4 font-semibold">Nama Kecamatan</th>
            <th className="p-4 font-semibold">Kabupaten</th>
            <th className="p-4 font-semibold text-center">Aksi</th>
          </tr>
        );
      case 'villages':
        return (
          <tr>
            <th className="p-4 font-semibold">Kode</th>
            <th className="p-4 font-semibold">Nama Desa</th>
            <th className="p-4 font-semibold">Kecamatan</th>
            <th className="p-4 font-semibold text-center">Aksi</th>
          </tr>
        );
    }
  };

  // --- RENDER TABLE BODY BERDASARKAN TAB ---
  const renderTableBody = () => {
    if (loading) return <tr><td colSpan={4} className="p-10 text-center text-gray-500">Memuat data...</td></tr>;
    if (data.length === 0) return <tr><td colSpan={4} className="p-10 text-center text-gray-500">Belum ada data.</td></tr>;

    return data.map((item) => (
      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <td className="p-4 text-gray-600 dark:text-gray-300">{item.code}</td>
        <td className="p-4 font-medium">{item.name}</td>
        
        {/* Kolom ke-3 dinamis berdasarkan tab */}
        <td className="p-4 text-gray-600 dark:text-gray-300">
          {activeTab === 'provinces' && item.capital}
          {activeTab === 'regencies' && (item.province?.name || '-')}
          {activeTab === 'districts' && (item.regency?.name || '-')}
          {activeTab === 'villages' && (item.district?.name || '-')}
        </td>

        <td className="p-4 text-center space-x-2">
          <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:underline text-sm font-semibold">Edit</button>
          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-sm font-semibold">Hapus</button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">📍</span> Manajemen Wilayah
          </h1>
          <p className="text-gray-500 mt-1">Kelola data Provinsi, Kabupaten, Kecamatan, dan Desa.</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Tambah {activeTab === 'provinces' ? 'Provinsi' : activeTab === 'regencies' ? 'Kab/Kota' : activeTab === 'districts' ? 'Kecamatan' : 'Desa'}
        </button>
      </div>

      {/* Tabs Navigasi */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {(['provinces', 'regencies', 'districts', 'villages'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'provinces' ? 'Provinsi' : tab === 'regencies' ? 'Kabupaten/Kota' : tab === 'districts' ? 'Kecamatan' : 'Desa/Kelurahan'}
          </button>
        ))}
      </div>

      {/* Tabel Data */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm">
              {renderTableHeader()}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {renderTableBody()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">
              {editId ? 'Edit' : 'Tambah'} {activeTab === 'provinces' ? 'Provinsi' : activeTab === 'regencies' ? 'Kabupaten/Kota' : activeTab === 'districts' ? 'Kecamatan' : 'Desa'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kode Wilayah</label>
                <input 
                  type="text" required 
                  className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  value={form.code || ''} onChange={(e) => setForm({...form, code: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nama Wilayah</label>
                <input 
                  type="text" required 
                  className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  value={form.name || ''} onChange={(e) => setForm({...form, name: e.target.value})} 
                />
              </div>

              {/* Kolom Spesifik per Tab */}
              {activeTab === 'provinces' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Ibu Kota</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    value={form.capital || ''} onChange={(e) => setForm({...form, capital: e.target.value})} 
                  />
                </div>
              )}

              {activeTab === 'regencies' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipe</label>
                    <select 
                      className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                      value={form.type || 'KABUPATEN'} onChange={(e) => setForm({...form, type: e.target.value})}
                    >
                      <option value="KABUPATEN">Kabupaten</option>
                      <option value="KOTA">Kota</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Provinsi Induk</label>
                    <select 
                      required
                      className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                      value={form.provinceId || ''} onChange={(e) => setForm({...form, provinceId: e.target.value})}
                    >
                      <option value="">-- Pilih Provinsi --</option>
                      {provincesList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'districts' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Kabupaten Induk</label>
                  <select 
                    required
                    className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    value={form.regencyId || ''} onChange={(e) => setForm({...form, regencyId: e.target.value})}
                  >
                    <option value="">-- Pilih Kabupaten --</option>
                    {regenciesList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}

              {activeTab === 'villages' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipe</label>
                    <select 
                      className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                      value={form.type || 'DESA'} onChange={(e) => setForm({...form, type: e.target.value})}
                    >
                      <option value="DESA">Desa</option>
                      <option value="KELURAHAN">Kelurahan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Kecamatan Induk</label>
                    <select 
                      required
                      className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                      value={form.districtId || ''} onChange={(e) => setForm({...form, districtId: e.target.value})}
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {districtsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
                  Simpan Data
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
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