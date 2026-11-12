'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(form);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

            const role = response.user.role;
      if (role === 'SUPER_ADMIN') {
        router.push('/dashboard/admin');
      } else if (role === 'VILLAGE_ADMIN') {
        router.push('/dashboard/village');
      } else if (role === 'RT_ADMIN') {          // ✅ Tambahkan
        router.push('/dashboard/rt');
      } else if (role === 'RW_ADMIN') {          // ✅ Tambahkan
        router.push('/dashboard/rw');
      } else {
        router.push('/dashboard/citizen');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fungsi untuk kirim ulang OTP
  const handleResendOtp = async () => {
    try {
      if (!form.email) {
        alert("Silakan isi email Anda terlebih dahulu di kolom input.");
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Gagal mengirim ulang OTP');

      alert('Kode OTP baru telah dikirim ke email Anda. Silakan cek Inbox/Spam.');
      router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDemoLogin = (email: string) => {
    setForm({ email, password: 'password123' });
  };

  return (
    <main className="min-h-screen flex">
      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-start p-16 text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-4xl mb-8 shadow-2xl border border-white/30">
            🏛️
          </div>
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            Sistem Informasi
            <br />
            <span className="text-cyan-300">Wilayah & Pemerintahan</span>
          </h1>
          <p className="text-lg text-blue-100 mb-8 max-w-md leading-relaxed">
            Platform terintegrasi berbasis AI untuk pengelolaan data wilayah,
            pemerintahan desa, dan pelayanan publik.
          </p>

          {/* Features */}
          <div className="space-y-3">
            {[
              { icon: '🤖', text: 'AI Assistant untuk pencarian informasi' },
              { icon: '🔒', text: 'Keamanan data terjamin' },
              { icon: '📊', text: 'Statistik real-time' },
              { icon: '🏘️', text: 'Multi-level wilayah (Provinsi → RT)' },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-xl border border-white/20">
                  {feature.icon}
                </div>
                <span className="text-blue-50">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-3">
              🏛️
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Sistem Informasi</h1>
            <p className="text-gray-500">Wilayah & Pemerintahan</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Selamat Datang!</h2>
              <p className="text-gray-500">Masuk ke akun Anda untuk melanjutkan</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slide-in">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
                {/* ✅ TOMBOL KIRIM ULANG OTP (Muncul jika error karena belum verifikasi) */}
                {error.includes('belum diverifikasi') && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline"
                    >
                      Kirim Ulang Kode OTP
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    📧
                  </span>
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    🔒
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    placeholder="••••••••"
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
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Memproses...
                  </span>
                ) : (
                  '🔓 Masuk'
                )}
              </button>
            </form>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Belum punya akun?{' '}
              <a
                href="/register"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Daftar Sekarang
              </a>
            </p>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400 font-medium">
                  🎯 Akun Demo
                </span>
              </div>
            </div>

            {/* Demo Accounts */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@system.com')}
                className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl hover:from-red-100 hover:to-red-200 transition-all border border-red-200 group"
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">👑</div>
                <div className="text-xs font-semibold text-red-700">Super Admin</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('desa@example.com')}
                className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all border border-blue-200 group"
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🏘️</div>
                <div className="text-xs font-semibold text-blue-700">Admin Desa</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('warga@example.com')}
                className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all border border-green-200 group"
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">👤</div>
                <div className="text-xs font-semibold text-green-700">Warga</div>
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">
              Klik salah satu untuk mengisi form otomatis
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 Sistem Informasi Wilayah & Pemerintahan
          </p>
        </div>
      </div>
    </main>
  );
}