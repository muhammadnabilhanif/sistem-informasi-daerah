import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get('public')
  @SkipRegionScope()
  async getPublicDocuments(@Query('villageId') villageId: string) {
    return this.documentsService.findPublic(villageId);
  }

  @Get()
  @SkipRegionScope()
  async findAll(
    @Query('villageId') villageId?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    if (req?.user && req.user.role !== 'SUPER_ADMIN') {
      villageId = req.user.villageId;
    }
    return this.documentsService.findAll(villageId, status);
  }

  @Get(':id')
  @SkipRegionScope()
  async findOne(@Param('id') id: string, @Request() req) {
    return this.documentsService.findOne(id, req.user);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/jpg',
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipe file tidak diizinkan'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() data: CreateDocumentDto,
    @UploadedFile() file: any,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('File wajib diupload');
    }
    if (req.user.role === 'VILLAGE_ADMIN') {
      data.villageId = req.user.villageId;
    }
    return this.documentsService.create(data, file, req.user.id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async update(
    @Param('id') id: string,
    @Body() data: UpdateDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.update(id, data, req.user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async delete(@Param('id') id: string, @Request() req) {
    return this.documentsService.delete(id, req.user);
  }

  @Post(':id/publish')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async publish(@Param('id') id: string, @Request() req) {
    return this.documentsService.publish(id, req.user);
  }

  @Get(':id/download')
  @SkipRegionScope()
  async download(
    @Param('id') id: string,
    @Request() req,
    @Res() res: Response,
  ) {
    // ✅ Fix: kirim user ke findOne
    const doc = await this.documentsService.findOne(id, req.user);

    // ✅ Fix: null check
    if (!doc) {
      throw new NotFoundException('Dokumen tidak ditemukan');
    }

    await this.documentsService.incrementDownload(id);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.fileName}"`,
    );
    res.setHeader('Content-Type', doc.mimeType);

    return res.sendFile(doc.filePath, { root: '.' });
  }
}