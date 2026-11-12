"use client";
import Link from "next/link";
import { Megaphone, FileText } from "lucide-react";

export default function DashboardWargaPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Selamat Datang, Warga!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Aduan */}
        <Link href="/dashboard/warga/aduan" className="block">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-lg transition cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 text-white rounded-full">
                <Megaphone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 dark:text-blue-100">Buat Pengaduan</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">Laporkan masalah di lingkungan RT/RW Anda</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Card Surat (Opsional) */}
        <Link href="/dashboard/services" className="block">
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-lg transition cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 text-white rounded-full">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-green-900 dark:text-green-100">Ajukan Surat</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Buat surat keterangan dan administrasi</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}