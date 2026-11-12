'use client';

import Link from 'next/link';

export default function Home() {
  const features = [
    {
      icon: '🤖',
      title: 'AI Assistant',
      description: 'Tanya informasi desa dengan bahasa alami',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      icon: '📍',
      title: 'Data Wilayah',
      description: 'Provinsi, Kabupaten, Kecamatan, Desa',
      gradient: 'from-green-500 to-green-600',
    },
    {
      icon: '📊',
      title: 'Statistik Real-time',
      description: 'Data penduduk yang akurat dan terkini',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      icon: '📰',
      title: 'Informasi Publik',
      description: 'Berita, pengumuman, agenda, dan dokumen',
      gradient: 'from-orange-500 to-orange-600',
    },
  ];

  const stats = [
    { value: '34', label: 'Provinsi', icon: '🏛️' },
    { value: '514', label: 'Kabupaten/Kota', icon: '🏙️' },
    { value: '7.277', label: 'Kecamatan', icon: '🏘️' },
    { value: '83.000+', label: 'Desa/Kelurahan', icon: '🏡' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg">
              🏛️
            </div>
            <div>
              <h1 className="font-bold text-gray-800 leading-tight">Sistem Informasi</h1>
              <p className="text-blue-600 text-xs">Wilayah & Pemerintahan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-5 py-2 text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        {/* Decorative Circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-700">
                Powered by Google Gemini AI
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Sistem Informasi Wilayah
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Berbasis Artificial Intelligence
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Platform terintegrasi untuk pengelolaan data wilayah, pemerintahan desa,
              dan pelayanan publik dengan dukungan AI Assistant yang cerdas.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                🚀 Mulai Sekarang
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                📝 Daftar Akun
              </Link>
            </div>

            {/* Trust Badge */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                <span>Gratis Digunakan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500">🔒</span>
                <span>Data Aman & Terenkripsi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500">⚡</span>
                <span>Real-time & Responsif</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-lg transition-all group"
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola informasi desa/kelurahan dalam satu platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all group hover:-translate-y-1"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-purple-400/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Siap Memulai?
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                Daftar sekarang dan rasakan kemudahan mengakses informasi desa/kelurahan
                dengan dukungan AI Assistant.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                >
                  📝 Daftar Gratis
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all"
                >
                  🔑 Sudah Punya Akun?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-sm">
              🏛️
            </div>
            <span className="font-bold text-gray-800">Sistem Informasi Wilayah</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 Sistem Informasi Wilayah & Pemerintahan. Dibuat dengan ❤️ untuk Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}