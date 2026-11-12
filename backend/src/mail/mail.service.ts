import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) { }

  // ============================================
  // KIRIM OTP (Registrasi)
  // ============================================
  async sendVerificationCode(to: string, name: string, code: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Kode Verifikasi Akun - Sistem Informasi Desa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Verifikasi Akun Anda</h2>
          <p>Halo <strong>${name}</strong>,</p>
          <p>Terima kasih telah mendaftar di Sistem Informasi Desa. Berikut adalah kode verifikasi OTP Anda:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background: #f3f4f6; padding: 10px 20px; border-radius: 8px; color: #1f2937;">${code}</span>
          </div>
          <p>Kode ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapa pun.</p>
          <br/>
          <p>Salam,<br/>Admin Desa</p>
        </div>
      `,
    });
  }

  // ============================================
  // KIRIM SURAT SELESAI (PDF Attachment)
  // ============================================
  async sendServiceCompletedEmail(
    to: string,
    name: string,
    requestNumber: string,
    serviceName: string,
    pdfUrl: string
  ) {
    // 1. Siapkan path file fisik PDF di server backend
    // pdfUrl contohnya: /uploads/letters/SKTM-2026-0010.pdf
    const fileName = path.basename(pdfUrl);
    const filePath = path.join(process.cwd(), 'uploads', 'letters', fileName);

    // 2. Cek apakah file benar-benar ada di folder backend
    const attachments: any[] = [];
    if (fs.existsSync(filePath)) {
      attachments.push({
        filename: `${requestNumber}.pdf`, // Nama file saat diunduh penerima
        path: filePath, // Lokasi file fisik di server
      });
    } else {
      this.logger.error(`❌ File PDF tidak ditemukan di path: ${filePath}`);
    }

    // 3. Kirim email beserta file lampirannya
    await this.mailerService.sendMail({
      to,
      subject: `Surat Anda Telah Selesai: ${requestNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">Surat Anda Telah Selesai</h2>
          <p>Halo <strong>${name}</strong>,</p>
          <p>Kabar baik! Pengajuan <strong>${serviceName}</strong> Anda dengan nomor <strong>${requestNumber}</strong> telah selesai diproses oleh Admin Desa.</p>
          
          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
            <p style="font-size: 16px; color: #166534; margin: 0;">
              📄 <strong>Surat dalam bentuk PDF telah dilampirkan pada email ini.</strong>
            </p>
            <p style="font-size: 14px; color: #166534; margin-top: 5px;">
              Silakan cek bagian lampiran (attachment) di bagian bawah email ini untuk mengunduhnya.
            </p>
          </div>
          
          <p>Terima kasih telah menggunakan layanan digital desa kami.</p>
          <br/>
          <p>Salam,<br/>Admin Desa</p>
        </div>
      `,
      attachments: attachments, // ✅ Lampirkan file PDF secara langsung
    });
  }
}