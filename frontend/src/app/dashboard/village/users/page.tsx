'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { showSuccess, showError } from '@/lib/swal';

export default function CreateRtRwPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RT_ADMIN', 
    number: '',     // Nomor RT (jika role RT) atau Nomor RW (jika role RW)
    rwNumber: '',   // Khusus untuk role RT, harus tahu dia ada di RW mana
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      if (!user.villageId) {
        throw new Error('Gagal mendapatkan ID Desa. Pastikan Anda login sebagai Admin Desa.');
      }

      // Validasi Frontend sebelum kirim
      if (form.role === 'RT_ADMIN' && !form.rwNumber) {
        throw new Error('Nomor RW wajib diisi untuk membuat akun Ketua RT.');
      }

      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        villageId: user.villageId, // ✅ Ambil dari Admin Desa yang login
        rtNumber: form.role === 'RT_ADMIN' ? form.number : undefined,
        // Jika role-nya RW, nomor RW ambil dari 'number'. Jika role-nya RT, ambil dari 'rwNumber'
        rwNumber: form.role === 'RT_ADMIN' ? form.rwNumber : form.number,
      };

      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membuat akun');

      showSuccess('Berhasil!', `Akun ${form.role === 'RT_ADMIN' ? 'Ketua RT' : 'Ketua RW'} berhasil dibuat.`);
      setTimeout(() => router.push('/dashboard/village'), 2000);
    } catch (error: any) {
      showError('Gagal', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto text-gray-800 dark:text-gray-100">
      <div className="mb-6">
        <Link href="/dashboard/village" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
          &larr; Kembali ke Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Tambah Akun RT / RW</h1>
        <p className="text-gray-500 dark:text-gray-400">Buatkan akun untuk Ketua RT atau Ketua RW di desa Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
        
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select 
            className="w-full border p-2 rounded-lg dark:bg-gray-900 dark:border-gray-700"
            value={form.role} 
            onChange={(e) => setForm({...form, role: e.target.value})}
          >
            <option value="RT_ADMIN">Ketua RT</option>
            <option value="RW_ADMIN">Ketua RW</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Nomor {form.role === 'RT_ADMIN' ? 'RT' : 'RW'}
          </label>
          <input 
            type="text" 
            required 
            placeholder="Contoh: 001"
            className="w-full border p-2 rounded-lg dark:bg-gray-900 dark:border-gray-700"
            value={form.number} 
            onChange={(e) => setForm({...form, number: e.target.value})} 
          />
        </div>

        {/* ✅ INPUT TAMBAHAN: Nomor RW (Hanya muncul jika rolenya RT) */}
        {form.role === 'RT_ADMIN' && (
          <div>
            <label className="block text-sm font-medium mb-1">Berada di Nomor RW</label>
            <input 
              type="text" 
              required 
              placeholder="Contoh: 002"
              className="w-full border p-2 rounded-lg dark:bg-gray-900 dark:border-gray-700"
              value={form.rwNumber} 
              onChange={(e) => setForm({...form, rwNumber: e.target.value})} 
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
          <input 
            type="text" 
            required 
            className="w-full border p-2 rounded-lg dark:bg-gray-900 dark:border-gray-700"
            value={form.name} 
            onChange={(e) => setForm({...form, name: e.target.value})} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input 
            type="email" 
            required 
            className="w-full border p-2 rounded-lg dark:bg-gray-900 dark:border-gray-700"
            value={form.email} 
            onChange={(e) => setForm({...form, email: e.target.value})} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" 
            required 
            className="w-full border p-2 rounded-lg dark:bg-gray-900 dark:border-gray-700"
            value={form.password} 
            onChange={(e) => setForm({...form, password: e.target.value})} 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Akun'}
        </button>
      </form>
    </div>
  );
}