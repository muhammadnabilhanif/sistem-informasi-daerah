import { Test, TestingModule } from '@nestjs/testing';
import { ComplaintsService } from './complaints.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ComplaintsService', () => {
  let service: ComplaintsService;
  
  // Mock PrismaService agar tidak perlu koneksi ke database asli saat testing
  const mockPrismaService = {
    complaint: {
      create: jest.fn().mockResolvedValue({ id: '1', title: 'Test Aduan' }),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ id: '1', status: 'RESOLVED' }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user-1', rtId: 'rt-1', rwId: 'rw-1' }),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplaintsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ComplaintsService>(ComplaintsService);
  });

  it('harus bisa membuat aduan baru (create)', async () => {
    const dto = { title: 'Lampu Mati', description: 'Lampu di RT 01 mati' };
    const result = await service.create('user-1', dto);
    expect(result).toEqual({ id: '1', title: 'Test Aduan' });
  });

  it('harus mengembalikan daftar aduan (findAll)', async () => {
    const result = await service.findAll({ role: 'RT_ADMIN', rtId: 'rt-1' });
    expect(result).toEqual([]);
  });

  it('harus bisa mengubah status aduan (updateStatus)', async () => {
    const result = await service.updateStatus('1', 'RESOLVED');
    expect(result.status).toEqual('RESOLVED');
  });
});