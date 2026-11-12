import { PrismaService } from '../../../prisma/prisma.service';

export async function generateRequestNumber(
  prisma: PrismaService,
  serviceCode: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${serviceCode}-${year}-`;

  // Cari nomor terakhir untuk kode ini di tahun ini
  const lastRequest = await prisma.serviceRequest.findFirst({
    where: {
      requestNumber: { startsWith: prefix },
    },
    orderBy: { requestNumber: 'desc' },
  });

  let nextNumber = 1;
  if (lastRequest) {
    const lastNumber = parseInt(lastRequest.requestNumber.split('-')[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}