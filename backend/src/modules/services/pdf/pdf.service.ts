import { Injectable, Logger } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateLetterPdf(data: any): Promise<string> {
    const fileName = `${data.requestNumber}.pdf`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'letters');

    // Pastikan folder ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // KOP SURAT
      doc.fontSize(14).font('Helvetica-Bold').text('PEMERINTAH KABUPATEN/KOTA', { align: 'center' });
      doc.fontSize(12).text('KECAMATAN', { align: 'center' });
      doc.fontSize(16).text(`DESA/KELURAHAN ${data.serviceType?.village?.name?.toUpperCase() || 'SUKAMAJU'}`, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Jl. Raya Desa No. 1, Kecamatan, Kabupaten', { align: 'center' });
      doc.moveDown(0.5);
      
      // Garis Kop
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(2).stroke();
      doc.moveDown(1.5);

      // JUDUL SURAT
      doc.fontSize(14).font('Helvetica-Bold').text(`SURAT KETERANGAN ${data.serviceType?.name?.toUpperCase() || ''}`, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`Nomor: ${data.requestNumber}`, { align: 'center' });
      doc.moveDown(1.5);

      // ISI SURAT
      doc.fontSize(12).text('Yang bertanda tangan di bawah ini, Kepala Desa, menerangkan bahwa:', { align: 'justify' });
      doc.moveDown(0.5);

      // Data Pemohon
      doc.text(`Nama      : ${data.applicantName}`);
      doc.text(`NIK          : ${data.applicantNik || '-'}`);
      doc.text(`Alamat    : ${data.applicantAddress || '-'}`);
      doc.text(`Keperluan : ${data.purpose}`);
      doc.moveDown(1.5);

      doc.text('Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.', { align: 'justify' });
      doc.moveDown(2);

      // TANDA TANGAN
      const signX = 350;
      doc.text(`Desa Sukamaju, ${new Date().toLocaleDateString('id-ID')}`, signX);
      doc.text('Kepala Desa', signX);
      doc.moveDown(3);
      doc.font('Helvetica-Bold').text('(_________________________)', signX);

      doc.end();

      stream.on('finish', () => {
        this.logger.log(`PDF generated: ${fileName}`);
        resolve(`/uploads/letters/${fileName}`);
      });

      stream.on('error', reject);
    });
  }
}