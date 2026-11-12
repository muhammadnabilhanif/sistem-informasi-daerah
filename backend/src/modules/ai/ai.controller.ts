import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';
import { ChatDto } from './dto/chat.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('test')
  @SkipRegionScope()
  async test(@Query('model') model?: string) {
    return this.aiService.testConnection(model);
  }

  @Post('chat')
  @SkipRegionScope()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async chat(@Request() req, @Body() data: ChatDto) {
    return this.aiService.chat(req.user, data);
  }

  @Get('conversations')
  @SkipRegionScope()
  async getConversations(@Request() req) {
    return this.aiService.getConversations(req.user.id);
  }

  @Get('conversations/:id')
  @SkipRegionScope()
  async getMessages(@Param('id') id: string, @Request() req) {
    return this.aiService.getMessages(id, req.user.id);
  }

  @Delete('conversations/:id')
  @SkipRegionScope()
  async deleteConversation(@Param('id') id: string, @Request() req) {
    return this.aiService.deleteConversation(id, req.user.id);
  }

  // ============================================
  // ✅ ENDPOINT PENGATURAN AI (KHUSUS SUPER ADMIN)
  // ============================================

  @Get('setting')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async getAiSetting() {
    return this.aiService.getAiSetting();
  }

  @Put('setting')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async updateAiSetting(@Body() data: any) {
    return this.aiService.updateAiSetting(data);
  }

  // ============================================
  // ✅ MANAJEMEN API KEY (KHUSUS SUPER ADMIN)
  // ============================================

  /**
   * Daftar semua API Key (tersamarkan) yang tersimpan.
   */
  @Get('keys')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async listApiKeys() {
    return this.aiService.listApiKeys();
  }

  /**
   * Tambah key baru atau perbarui key yang sudah ada.
   * Body: { id?: string, label?: string, newRawKey?: string, isActive?: boolean, priority?: number }
   * - Jika id tidak ada → tambah key baru (newRawKey wajib diisi)
   * - Jika id ada dan newRawKey kosong → pertahankan key lama
   * - Jika id ada dan newRawKey diisi → ganti key lama
   */
  @Put('keys')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async upsertApiKey(
    @Body() body: {
      id?: string;
      label?: string;
      newRawKey?: string;
      isActive?: boolean;
      priority?: number;
    },
  ) {
    return this.aiService.upsertApiKey(body);
  }

  /**
   * Hapus satu API Key berdasarkan ID-nya.
   */
  @Delete('keys/:keyId')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async deleteApiKey(@Param('keyId') keyId: string) {
    return this.aiService.deleteApiKey(keyId);
  }

  /**
   * Perbarui urutan prioritas semua key sekaligus.
   * Body: { orderedIds: string[] }
   */
  @Patch('keys/reorder')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async reorderApiKeys(@Body() body: { orderedIds: string[] }) {
    return this.aiService.reorderApiKeys(body.orderedIds);
  }

  /**
   * Uji koneksi satu key tertentu (berdasarkan ID-nya).
   */
  @Post('keys/:keyId/test')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async testSpecificKey(
    @Param('keyId') keyId: string,
    @Query('model') model?: string,
  ) {
    return this.aiService.testSpecificKey(keyId, model);
  }
}