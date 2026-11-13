# 🏛️ Sistem Informasi Daerah dan Pemerintahan Berbasis AI

![Backend CI Pipeline](https://github.com/muhammadnabilhanif/sistem-informasi-daerah/actions/workflows/ci.yml/badge.svg)

 Sistem Informasi Daerah dan Pemerintahan Berbasis AI Platform digital terintegrasi berbasis web yang dirancang untuk mengelola tata kelola pemerintahan daerah bertingkat (Provinsi, Kabupaten/Kota, Kecamatan, Desa/Kelurahan, hingga Rukun Warga [RW] dan Rukun Tetangga [RT]). Sistem ini memfasilitasi pelayanan administrasi persuratan warga secara berjenjang, publikasi informasi desa, penanganan aduan masyarakat, visualisasi demografi kependudukan, serta asisten percakapan cerdas (AI Assistant) yang didukung oleh Google Gemini dan Groq LLaMA.
---

## 👤 Identitas Pengembang (Tugas Proyek Akhir Mandiri RPL)

* **Nama Mahasiswa:** Muhammad Nabil Hanif
* **NIM:** 41257134
* **Kelas / Semester:** TI-1B-2025 / Semester 3
* **Program Studi:** S1 Teknik Informatika — STMIK IKMI Cirebon
* **Mata Kuliah:** Rekayasa Perangkat Lunak (TIKB2503021)
* **Dosen Pengampu:** Yudhistira Arie Wijaya, M.Kom., CDS.

---

## 🔗 Tautan Artefak & Dokumentasi Proyek

* 🎨 **Prototipe Interaktif UI/UX (Figma):** [Buka Desain Figma SIWIL-AI](https://www.figma.com/design/fUy4PCPjZ92w8aGDP9h5vj/UI-UX-SIWIL-AI---Muhammad-Nabil-Hanif?node-id=0-1&t=My3x5dDPkW4fvLqe-1)
* 🎥 **Video Demo & Presentasi Proyek:** *(Link YouTube / Google Drive akan ditambahkan setelah rekaman selesai)*
* ⚙️ **Status CI/CD Pipeline:** [Lihat GitHub Actions](https://github.com/muhammadnabilhanif/sistem-informasi-daerah/actions)

---

## ✨ Fitur Utama Sistem

1. **Autentikasi & Otorisasi Berbasis Wilayah (*Region-Scoped RBAC*):**
   * Registrasi warga dengan verifikasi kode **OTP 6-digit via Email (SMTP)**.
   * Pembatasan hak akses berjenjang untuk 5 peran utama: `CITIZEN`, `RT_ADMIN`, `RW_ADMIN`, `VILLAGE_ADMIN`, dan `SUPER_ADMIN`.
2. **Pelayanan Surat Keterangan Berjenjang & PDF Otomatis:**
   * Alur verifikasi berjenjang otomatis dari **Ketua RT $\rightarrow$ Ketua RW $\rightarrow$ Admin Desa**.
   * Penerbitan otomatis dokumen surat resmi berformat **PDF ber-kop desa** (`PdfService`) dan pengiriman notifikasi lampiran melalui email (`MailService`).
3. **Pelaporan Pengaduan Lingkungan Warga:**
   * Warga dapat mengirimkan laporan keluhan beserta foto bukti yang otomatis terikat pada wilayah RT/RW domisili pelapor.
4. **AI Assistant Wilayah & Multi-API Key Failover:**
   * Asisten virtual cerdas yang menjawab pertanyaan publik dan perangkat desa berdasarkan konteks data wilayah yang telah disaring dari informasi sensitif (NIK).
   * Dilengkapi mekanisme *failover* otomatis dan *cooldown* 60 detik antara **Google Gemini (Primary)** dan **Groq LLAMA (Fallback)** saat terjadi *rate limit* (HTTP 429).
5. **Audit Trail & Statistik Kependudukan:**
   * Pencatatan otomatis setiap aktivitas mutasi data ke dalam `audit_logs` serta visualisasi grafik demografi desa.

---

## 🛠️ Stack Teknologi

* **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Zustand, Axios
* **Backend:** NestJS, TypeScript, Passport JWT, Helmet, Throttler
* **Database & ORM:** MySQL, Prisma ORM
* **Integrasi Layanan:** Google Gemini SDK, Groq SDK, Nodemailer (SMTP), PDFKit / Puppeteer
* **Testing & DevOps:** Jest (Automated Unit Testing), GitHub Actions (CI/CD Pipeline)

---

## 💻 Panduan Instalasi & Menjalankan Secara Lokal

### Prasyarat Sistem
* **Node.js** versi 18 atau 20+
* **MySQL / MariaDB** (XAMPP/Laragon/HeidiSQL)
* **NPM** atau **Yarn**

### 1. Clone Repositori
git clone [https://github.com/muhammadnabilhanif/sistem-informasi-daerah.git](https://github.com/muhammadnabilhanif/sistem-informasi-daerah.git)
cd sistem-informasi-daerah

### 2. Konfigurasi & Jalankan Backend (NestJS)
    cd backend
    npm install
    cp .env.example .env
    # Sesuaikan DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, dan GROQ_API_KEY pada file .env
    npx prisma generate
    npx prisma db push
    npm run start:dev
*(Server Backend berjalan pada `http://localhost:3000`)*

### 3. Konfigurasi & Jalankan Frontend (Next.js)
    cd frontend
    npm install
    npm run dev
*(Aplikasi Frontend berjalan pada `http://localhost:3001`)*

### 4. Menjalankan Automated Unit Testing
    cd backend
    npm run test
