'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (form.password.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    try {
      // Memanggil API register
      await authApi.register(form);

      // ✅ TIDAK ADA TOKEN DI SINI KARENA HARUS VERIFIKASI OTP
      // ✅ Jangan simpan token ke localStorage dulu
      
      setSuccess('Registrasi berhasil! Silakan cek email Anda untuk kode OTP.');

      // ✅ Arahkan ke halaman verifikasi OTP sambil membawa email
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-center items-start p-16 text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-4xl mb-8 shadow-2xl border border-white/30">
            ✨
          </div>
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            Bergabung
            <br />
            <span className="text-pink-300">Bersama Kami</span>
          </h1>
          <p className="text-lg text-purple-100 mb-8 max-w-md leading-relaxed">
            Daftar sekarang dan dapatkan akses ke informasi desa/kelurahan
            dengan mudah dan cepat.
          </p>

          <div className="space-y-3">
            {[
              { icon: '📱', text: 'Akses dari mana saja' },
              { icon: '🔔', text: 'Notifikasi informasi terbaru' },
              { icon: '🤖', text: 'Tanya AI Assistant kapan saja' },
              { icon: '📊', text: 'Lihat statistik desa Anda' },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-xl border border-white/20">
                  {feature.icon}
                </div>
                <span className="text-purple-50">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - REGISTER FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-3">
              ✨
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Daftar Akun</h1>
            <p className="text-gray-500">Mulai perjalanan Anda</p>
          </div>

          {/* Register Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Buat Akun Baru</h2>
              <p className="text-gray-500">Isi data di bawah untuk mendaftar</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slide-in">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-slide-in">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-lg">✅</span>
                  <p className="text-green-700 text-sm font-medium">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    placeholder="Nama lengkap Anda"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Telepon <span className="text-gray-400 text-xs">(opsional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📱</span>
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    placeholder="08xx-xxxx-xxxx"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    placeholder="Minimal 6 karakter"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Minimal 6 karakter</p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Memproses...
                  </span>
                ) : (
                  '✨ Daftar Sekarang'
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Sudah punya akun?{' '}
              <a
                href="/login"
                className="text-purple-600 hover:text-purple-700 font-semibold hover:underline"
              >
                Masuk di Sini
              </a>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 Sistem Informasi Wilayah & Pemerintahan
          </p>
        </div>
      </div>
    </main>
  );
}