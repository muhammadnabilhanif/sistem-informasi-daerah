import { Injectable } from '@nestjs/common';
import { UserScope } from './permission.service';

@Injectable()
export class ContextBuilderService {
  buildSystemPrompt(scope: UserScope, context: any): string {
    const roleLabel = this.getRoleLabel(scope.role);
    const menuList = this.getMenuList(scope.role);

    // ✅ 1. Ambil Konfigurasi AI dari Database
    const aiSetting = context.aiSetting || {};
    const aiName = aiSetting.aiName || 'Asisten Desa';
    const tone = aiSetting.tone || 'FORMAL';
    const customPrompt = aiSetting.customPrompt ? `\nINSTRUKSI KHUSUS DARI ADMIN: ${aiSetting.customPrompt}\n` : '';

    // ✅ 2. Tentukan Gaya Bahasa
    let gayaBahasa = "Gunakan bahasa Indonesia yang formal, sopan, dan baku (seperti pegawai pemerintah).";
    if (tone === 'SANTAI') {
      gayaBahasa = "Gunakan bahasa Indonesia yang santai, akrab, dan mudah dipahami (seperti teman ngobrol).";
    }

    let prompt = `Nama Anda adalah ${aiName}.
Anda adalah asisten AI untuk Sistem Informasi Wilayah dan Pemerintahan Desa/Kelurahan.
Tugas Anda adalah membantu pengguna memahami informasi tentang desa/kelurahan.

GAYA BAHASA: ${gayaBahasa}
${customPrompt}

PERATURAN PENTING:
1. Jawab HANYA berdasarkan data yang diberikan di bawah ini.
2. Jika data tidak tersedia, katakan "Maaf, informasi tersebut tidak tersedia dalam sistem".
3. JANGAN mengarang atau menebak informasi.
4. JANGAN pernah memberikan data pribadi (NIK, nomor KK, alamat lengkap, nomor telepon pribadi).
5. Saat menyapa pengguna, SELALU gunakan nama dari "INFORMASI PENGGUNA" (contoh: "Halo bapak nabil"). JANGAN memanggil mereka dengan sebutan Role (contoh: "Halo Super Admin").
6. Jika pengguna bertanya tentang "Fitur apa saja yang ada", "Menu sidebar", atau "Bisa apa saja di aplikasi ini", JAWABLAH berdasarkan daftar "Fitur/Menu yang Tersedia" di bagian INFORMASI PENGGUNA. Sebutkan jumlahnya dan apa saja fiturnya.
7. Jika pengguna bertanya tentang "Jumlah Kabupaten", "Jumlah Provinsi", "Jumlah Kecamatan", JAWABLAH berdasarkan data dari "STATISTIK & DAFTAR WILAYAH SISTEM".
9. Jika pengguna bertanya "Ada apa saja nama Provinsi/Kabupaten/Kecamatan/Desa" atau "Sebutkan nama-namanya", WAJIB HUKUMNYA untuk menyebutkan SEMUA NAMA yang tertera pada bagian "(Nama: ...)" di dalam "STATISTIK & DAFTAR WILAYAH SISTEM". JANGAN hanya menyebutkan jumlah totalnya saja.
10. Jika pengguna bertanya "Dimana Kecamatan X?", "Desa Y masuk Kecamatan/Kabupaten/Provinsi apa?", WAJIB HUKUMNYA untuk mencari nama tersebut di dalam "STRUKTUR HIERARKI WILAYAH" dan sebutkan urutan induknya (Desa -> Kecamatan -> Kabupaten -> Provinsi). Jika nama tersebut benar-benar tidak ada di daftar, barulah katakan tidak tersedia.
11.Jika pengguna meminta daftar wilayah (Provinsi, Kabupaten, Kecamatan, Desa) ATAU bertanya "dimana X", WAJIB HUKUMNYA untuk melihat "DAFTAR MASTER WILAYAH" dan "STRUKTUR HIERARKI". Sebutkan SEMUA nama yang ada di daftar tersebut tanpa ada yang terlewat. JANGAN hanya menyebutkan sebagian.
12. Jika pengguna (khusus Super Admin) bertanya tentang "Siapa saja user yang terdaftar?" atau "Sebutkan nama-nama user", WAJIB HUKUMNYA untuk menyebutkan nama-nama yang ada di bagian "Daftar Nama User" di dalam STATISTIK AKUN USER SISTEM.

PEMBEDAAN PENTING (BACA DENGAN TELITI):
- Jika pengguna bertanya tentang "Jumlah Penduduk", "Berapa Jiwa", "Laki-laki/Perempuan", JAWABLAH menggunakan data dari "STATISTIK PENDUDUK".
- Jika pengguna bertanya tentang "Jumlah Warga yang Mendaftar", "Berapa User", "Berapa Akun Warga", "Berapa Akun RT/RW", JAWABLAH menggunakan data dari "STATISTIK AKUN USER SISTEM".
- Jika pengguna bertanya tentang "Total Pengajuan Surat", JAWABLAH menggunakan data dari "STATISTIK TOTAL PENGAJUAN SURAT".

INFORMASI PENGGUNA:
- Nama: ${scope.userName || 'Pengguna'}
- Role: ${roleLabel}
- Tingkat Akses: ${this.getVisibilityLabel(scope.dataVisibility)}
- Fitur/Menu yang Tersedia: ${menuList.join(', ')}

`;

    if (!context || !context.village) {
      prompt += `\nDATA DESA: Tidak ada data desa yang dapat diakses.\n`;
      return prompt;
    }

        // ✅ TAMBAHKAN STATISTIK & HIERARKI WILAYAH
    if (context.wilayahStats) {
      prompt += `\n=== STATISTIK & DAFTAR WILAYAH SISTEM ===\n`;
      prompt += `Total Provinsi: ${context.wilayahStats.totalProvinces}\n`;
      prompt += `Total Kabupaten/Kota: ${context.wilayahStats.totalRegencies}\n`;
      prompt += `Total Kecamatan: ${context.wilayahStats.totalDistricts}\n`;
      prompt += `Total Desa/Kelurahan: ${context.wilayahStats.totalVillages}\n`;
      
      // ✅ Masukkan data list dan hierarki
      if (context.wilayahStats.hierarchy) {
        prompt += `\n${context.wilayahStats.hierarchy}\n`;
      }
    }

    prompt += `\n=== DATA DESA ===\n`;
    prompt += `Nama Desa: ${context.village.name}\n`;
    prompt += `Tipe: ${context.village.type === 'KELURAHAN' ? 'Kelurahan' : 'Desa'}\n`;
    prompt += `Kecamatan: ${context.village.district || '-'}\n`;
    prompt += `Kabupaten/Kota: ${context.village.regency || '-'}\n`;
    prompt += `Provinsi: ${context.village.province || '-'}\n`;

    if (context.profile) {
      prompt += `\n=== PROFIL DESA ===\n`;
      if (context.profile.description) prompt += `Deskripsi: ${context.profile.description}\n`;
      if (context.profile.vision) prompt += `Visi: ${context.profile.vision}\n`;
      if (context.profile.mission) prompt += `Misi: ${context.profile.mission}\n`;
      if (context.profile.address) prompt += `Alamat: ${context.profile.address}\n`;
      if (context.profile.phone) prompt += `Telepon: ${context.profile.phone}\n`;
      if (context.profile.email) prompt += `Email: ${context.profile.email}\n`;
      if (context.profile.website) prompt += `Website: ${context.profile.website}\n`;
    }

    if (context.officials && context.officials.length > 0) {
      prompt += `\n=== STRUKTUR PEMERINTAHAN ===\n`;
      context.officials.forEach((o: any) => {
        prompt += `- ${o.position}: ${o.name}\n`;
      });
    }

    // ✅ PROGRAM KERJA
    if (context.recentPrograms && context.recentPrograms.length > 0) {
      prompt += `\n=== PROGRAM KERJA TERBARU ===\n`;
      context.recentPrograms.forEach((p: any) => {
        prompt += `- ${p.title}`;
        if (p.status) prompt += ` (Status: ${p.status})`;
        if (p.budget) prompt += ` - Anggaran: Rp ${this.formatNumber(p.budget)}`;
        prompt += `\n`;
      });
    } else {
      prompt += `\n=== PROGRAM KERJA TERBARU ===\nBelum ada program kerja.\n`;
    }

    if (context.statistics) {
      const s = context.statistics;
      prompt += `\n=== STATISTIK PENDUDUK (${s.year} Semester ${s.semester}) ===\n`;
      prompt += `Total Penduduk: ${this.formatNumber(s.totalPopulation)} jiwa\n`;
      prompt += `Laki-laki: ${this.formatNumber(s.maleCount)} jiwa\n`;
      prompt += `Perempuan: ${this.formatNumber(s.femaleCount)} jiwa\n`;
      prompt += `Kepala Keluarga: ${this.formatNumber(s.totalHouseholds)}\n`;

      if (s.ageGroups && typeof s.ageGroups === 'object') {
        prompt += `\nKelompok Umur:\n`;
        Object.entries(s.ageGroups).forEach(([key, value]) => {
          prompt += `- ${key} tahun: ${this.formatNumber(value as number)} jiwa\n`;
        });
      }

      if (s.educationStats && typeof s.educationStats === 'object') {
        prompt += `\nPendidikan:\n`;
        Object.entries(s.educationStats).forEach(([key, value]) => {
          prompt += `- ${key}: ${this.formatNumber(value as number)} orang\n`;
        });
      }

      if (s.occupationStats && typeof s.occupationStats === 'object') {
        prompt += `\nPekerjaan:\n`;
        Object.entries(s.occupationStats).forEach(([key, value]) => {
          prompt += `- ${key}: ${this.formatNumber(value as number)} orang\n`;
        });
      }
    }

    // ✅ BERITA (Dengan Status)
    if (context.recentNews && context.recentNews.length > 0) {
      prompt += `\n=== BERITA TERBARU ===\n`;
      context.recentNews.forEach((n: any) => {
        prompt += `- [${n.status}] ${n.title}`;
        if (n.excerpt) prompt += `: ${n.excerpt}`;
        prompt += `\n`;
      });
    } else {
      prompt += `\n=== BERITA TERBARU ===\nBelum ada berita.\n`;
    }

    // ✅ PENGUMUMAN (Dengan Status)
    if (context.recentAnnouncements && context.recentAnnouncements.length > 0) {
      prompt += `\n=== PENGUMUMAN TERBARU ===\n`;
      context.recentAnnouncements.forEach((a: any) => {
        prompt += `- [${a.priority}] [${a.status}] ${a.title}`;
        if (a.summary) prompt += `: ${a.summary}`;
        prompt += `\n`;
      });
    } else {
      prompt += `\n=== PENGUMUMAN TERBARU ===\nBelum ada pengumuman.\n`;
    }

    // ✅ AGENDA (Dengan Tanggal)
    if (context.upcomingAgendas && context.upcomingAgendas.length > 0) {
      prompt += `\n=== AGENDA ===\n`;
      context.upcomingAgendas.forEach((a: any) => {
        prompt += `- ${a.title}`;
        if (a.location) prompt += ` di ${a.location}`;
        if (a.startDatetime) prompt += ` (${new Date(a.startDatetime).toLocaleDateString('id-ID')})`;
        prompt += `\n`;
      });
    } else {
      prompt += `\n=== AGENDA ===\nBelum ada agenda.\n`;
    }

    // ✅ DOKUMEN PUBLIK (Dengan Status)
    if (context.recentDocuments && context.recentDocuments.length > 0) {
      prompt += `\n=== DOKUMEN PUBLIK TERBARU ===\n`;
      context.recentDocuments.forEach((d: any) => {
        prompt += `- [${d.status}] ${d.title}`;
        if (d.category) prompt += ` (Kategori: ${d.category})`;
        prompt += `\n`;
      });
    } else {
      prompt += `\n=== DOKUMEN PUBLIK TERBARU ===\nBelum ada dokumen.\n`;
    }

    // ✅ STATISTIK SURAT
    if (context.requestStats) {
      prompt += `\n=== STATISTIK TOTAL PENGAJUAN SURAT ===\n`;
      prompt += `Total Seluruh Pengajuan: ${context.requestStats.total} surat\n`;
      prompt += `Menunggu Verifikasi (PENDING): ${context.requestStats.pending} surat\n`;
      prompt += `Sedang Diproses (VERIFIED): ${context.requestStats.verified} surat\n`;
      prompt += `Selesai (COMPLETED): ${context.requestStats.completed} surat\n`;
      prompt += `Ditolak (REJECTED): ${context.requestStats.rejected} surat\n`;
    }

    if (context.serviceRequests && context.serviceRequests.length > 0) {
      prompt += `\n=== RIWAYAT PENGAJUAN SURAT (5 TERAKHIR) ===\n`;
      context.serviceRequests.forEach((req: any) => {
        prompt += `- No: ${req.requestNumber} | Layanan: ${req.serviceType?.name || '-'} | Status: ${req.status} | Keperluan: ${req.purpose} | Tanggal: ${new Date(req.createdAt).toLocaleDateString('id-ID')}\n`;
      });
      prompt += `\n(Catatan: Jika status COMPLETED, artinya surat sudah selesai dan bisa diunduh. Jika PENDING, surat masih menunggu verifikasi.)\n`;
    } else if (scope.role === 'CITIZEN') {
      prompt += `\n=== RIWAYAT PENGAJUAN SURAT ===\nBelum ada riwayat pengajuan surat.\n`;
    }

        // ✅ STATISTIK USER
    if (context.userStats) {
      prompt += `\n=== STATISTIK AKUN USER SISTEM ===\n`;
      prompt += `Total Semua Akun: ${context.userStats.totalSemua} akun\n`;
      prompt += `Total Super Admin: ${context.userStats.totalSuperAdmin} akun\n`;
      prompt += `Total Admin Desa: ${context.userStats.totalAdminDesa} akun\n`;
      prompt += `Total Ketua RT: ${context.userStats.totalRt} akun\n`;
      prompt += `Total Ketua RW: ${context.userStats.totalRw} akun\n`;
      prompt += `Total Warga Terdaftar: ${context.userStats.totalWarga} akun\n`;
      
      // ✅ TAMBAHKAN BARIS INI: Tampilkan daftar nama user
      if (context.userStats.userList) {
        prompt += `\nDaftar Nama User (Nama & Role): ${context.userStats.userList}\n`;
      }
    }

    prompt += `\n=== AKHIR DATA ===\n`;
    prompt += `\nJawab pertanyaan pengguna berdasarkan data di atas.\n`;

    return prompt;
  }

  buildConversationPrompt(
    systemPrompt: string,
    history: Array<{ role: string; content: string }>,
    userMessage: string,
  ): string {
    let prompt = systemPrompt + '\n\n=== RIWAYAT PERCAKAPAN ===\n';

    history.forEach((h) => {
      if (h.role === 'USER') {
        prompt += `Pengguna: ${h.content}\n`;
      } else if (h.role === 'ASSISTANT') {
        prompt += `Asisten: ${h.content}\n`;
      }
    });

    prompt += `\nPengguna: ${userMessage}\nAsisten:`;
    return prompt;
  }

  private getMenuList(role: string): string[] {
    const menus: Record<string, string[]> = {
      SUPER_ADMIN: [
        'Dashboard', 'Wilayah', 'Profil Desa', 'Struktur Pemerintahan', 
        'Program Kerja', 'Berita', 'Pengumuman', 'Agenda', 'Dokumen Publik', 
        'Layanan', 'Data Penduduk', 'Users', 'Audit Log', 'Pengaturan AI'
      ],
      VILLAGE_ADMIN: [
        'Dashboard Desa', 'Profil Desa', 'Struktur Pemerintahan', 
        'Program Kerja', 'Berita', 'Pengumuman', 'Agenda', 'Dokumen Publik', 
        'Layanan', 'Data Penduduk', 'Kelola RT/RW', 'Audit Log'
      ],
      RT_ADMIN: [
        'Dashboard RT', 'Persetujuan Surat'
      ],
      RW_ADMIN: [
        'Dashboard RW', 'Persetujuan Surat'
      ],
      CITIZEN: [
        'Informasi Desa', 'Profil Desa', 'Struktur Pemerintahan', 
        'Program Kerja', 'Berita', 'Pengumuman', 'Agenda', 'Dokumen Publik', 
        'Layanan', 'Statistik'
      ],
    };
    return menus[role] || menus.CITIZEN;
  }

  private getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin (Akses Penuh)',
      VILLAGE_ADMIN: 'Admin Desa/Kelurahan',
      CITIZEN: 'Warga',
      RT_ADMIN: 'Ketua RT',
      RW_ADMIN: 'Ketua RW',
    };
    return labels[role] || role;
  }

  private getVisibilityLabel(visibility: string): string {
    const labels: Record<string, string> = {
      ALL: 'Semua Data',
      VILLAGE: 'Data Desa Sendiri (Lengkap)',
      PUBLIC: 'Data Publik Desa Sendiri',
    };
    return labels[visibility] || visibility;
  }

  private formatNumber(num: number | undefined): string {
    if (!num) return '0';
    return new Intl.NumberFormat('id-ID').format(num);
  }
}