import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionService, UserScope } from './services/permission.service';
import { KnowledgeService } from './services/knowledge.service';
import { ContextBuilderService } from './services/context-builder.service';
import { ApiKeyManagerService } from './services/api-key-manager.service';
import { ChatDto } from './dto/chat.dto';
import Groq from 'groq-sdk';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Groq tetap menggunakan env untuk saat ini (tidak di-fallback seperti Gemini)
  private groq: Groq;
  private defaultModelName: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private permissionService: PermissionService,
    private knowledgeService: KnowledgeService,
    private contextBuilder: ContextBuilderService,
    private apiKeyManager: ApiKeyManagerService,
  ) {
    // Inisialisasi model default dari .env (fallback jika DB kosong)
    this.defaultModelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';

    // Inisialisasi Groq
    const groqApiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!groqApiKey) {
      this.logger.warn('⚠️ GROQ_API_KEY tidak ditemukan di .env. Fitur Groq nonaktif.');
    } else {
      this.groq = new Groq({ apiKey: groqApiKey });
      this.logger.log('✅ Groq AI initialized.');
    }

    // Gemini akan diinisialisasi per-request menggunakan key dari DB
    this.logger.log(`✅ AiService initialized. Default Gemini model: ${this.defaultModelName}`);
  }

  // ==============================
  // BUAT INSTANCE GEMINI DENGAN KEY TERTENTU
  // ==============================
  private createGeminiClient(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 60000,
      }
    });
  }

  // ==============================
  // AMBIL KEY DARI DB ATAU FALLBACK KE ENV
  // ==============================
  private async getGeminiKeysForRequest(setting: any): Promise<Array<{ id: string | null; rawKey: string; label?: string }>> {
    // Coba ambil dari DB (ApiKeyConfig)
    if (setting?.id) {
      try {
        const dbKeys = await this.apiKeyManager.getActiveRawKeys(setting.id);
        if (dbKeys.length > 0) {
          return dbKeys;
        }
      } catch (e) {
        this.logger.warn('Gagal membaca key dari DB, fallback ke .env');
      }
    }
    // Fallback ke .env
    const envKey = this.configService.get<string>('GEMINI_API_KEY');
    if (envKey) {
      return [{ id: null, rawKey: envKey, label: 'Key dari .env' }];
    }
    return [];
  }

  // ==============================
  // CALL GEMINI DENGAN FALLBACK OTOMATIS
  // ==============================
  private async callGeminiWithFallback(
    settingId: string | null,
    keys: Array<{ id: string | null; rawKey: string; label?: string }>,
    model: string,
    prompt: string,
  ): Promise<{ text: string; totalTokenCount: number; usedKeyId: string | null }> {
    const MAX_ATTEMPTS = keys.length;
    let lastError: any = null;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const keyEntry = keys[i];
      const keyLabel = keyEntry.label || `Key #${i + 1}`;

      try {
        this.logger.log(`🔑 Mencoba ${keyLabel} dengan model ${model}`);
        const client = this.createGeminiClient(keyEntry.rawKey);
        const response = await client.models.generateContent({
          model,
          contents: prompt,
        });

        // Sukses — perbarui status key
        if (settingId && keyEntry.id) {
          this.apiKeyManager.updateKeyStatus(settingId, keyEntry.id, 'ok').catch(() => { });
        }

        this.logger.log(`✅ Berhasil dengan ${keyLabel}`);
        return {
          text: response.text || '',
          totalTokenCount: response.usageMetadata?.totalTokenCount || 0,
          usedKeyId: keyEntry.id,
        };
      } catch (error: any) {
        lastError = error;

        // ✅ TAMBAHKAN INI: Jika jaringan putus (fetch failed) / Timeout, langsung coba Key berikutnya
        if (error.message?.includes('fetch failed') || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
          this.logger.warn(`⚠️ ${keyLabel} mengalami timeout (fetch failed). Mencoba key berikutnya...`);
          continue; // Lanjut ke perulangan (Key) berikutnya
        }

        // Jangan retry kalau error bukan karena key/quota (misal: Safety Block)
        if (this.apiKeyManager.isNonRetryableError(error)) {
          this.logger.warn(`⛔ Error non-retryable dari ${keyLabel}: ${error.message}`);
          throw error;
        }

        // Tandai key sebagai error (Limit/Invalid)
        if (settingId && keyEntry.id) {
          const isRateLimit = this.apiKeyManager.isRateLimitError(error);
          this.apiKeyManager.updateKeyStatus(settingId, keyEntry.id, 'error', isRateLimit).catch(() => { });
        }

        // Periksa apakah bisa dicoba ke key berikutnya
        if (!this.apiKeyManager.isRetryableWithNextKey(error)) {
          this.logger.warn(`⛔ Error tidak memenuhi syarat fallback dari ${keyLabel}`);
          throw error;
        }

        this.logger.warn(`⚠️ ${keyLabel} gagal (${error?.status || error?.message}). Mencoba key berikutnya...`);
      }
    }

    // Semua key gagal
    this.logger.error(`❌ Semua ${MAX_ATTEMPTS} key Gemini gagal.`);
    throw lastError || new InternalServerErrorException('Semua API Key Gemini gagal. Coba lagi nanti.');
  }

  // ==============================
  // CHAT UTAMA
  // ==============================
  async chat(user: any, data: ChatDto) {
    if (!data.message || data.message.trim().length === 0) {
      throw new BadRequestException('Pesan tidak boleh kosong');
    }

    // Ambil setting AI dari DB
    const setting = await this.getAiSetting();
    const modelToUse = data.model || setting.aiModel || this.defaultModelName;
    this.logger.log(`🤖 Menjawab dengan model: ${modelToUse}`);

    // Ambil data user terbaru dari database
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: { include: { role: true } } }
    });

    const scope = this.permissionService.getScope({
      ...user,
      name: dbUser?.name || user.name,
      role: dbUser?.roles[0]?.role.name || user.role,
    });

    await this.checkRateLimit(user.id);

    const conversation = await this.getOrCreateConversation(
      user.id,
      data.conversationId,
      scope.villageId,
    );

    // ==========================================
    // 1. Ambil data dinamis
    // ==========================================
    const recentNews = await this.prisma.news.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { title: true, excerpt: true, publishedAt: true, status: true }
    });

    const recentAnnouncements = await this.prisma.announcement.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { title: true, summary: true, priority: true, status: true }
    });

    const upcomingAgendas = await this.prisma.agenda.findMany({
      where: { deletedAt: null },
      orderBy: { startDatetime: 'desc' },
      take: 5,
      select: { title: true, location: true, startDatetime: true }
    });

    const recentPrograms = await this.prisma.villageProgram.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { title: true, status: true, budget: true }
    });

    const recentDocuments = await this.prisma.publicDocument.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { title: true, category: true, status: true }
    });

    // ==========================================
    // AMBIL SEMUA DATA WILAYAH (List & Hierarki)
    // ==========================================
    const allProvinces = await this.prisma.province.findMany({ where: { deletedAt: null }, select: { name: true } });
    const allRegencies = await this.prisma.regency.findMany({ where: { deletedAt: null }, select: { name: true } });

    const districtsWithParents = await this.prisma.district.findMany({
      where: { deletedAt: null },
      include: { regency: { include: { province: true } } }
    });

    const villagesWithParents = await this.prisma.village.findMany({
      where: { deletedAt: null },
      include: { district: { include: { regency: { include: { province: true } } } } }
    });

    // Susun teks list master dan hierarki
    let wilayahHierarchy = "=== DAFTAR MASTER WILAYAH ===\n";
    wilayahHierarchy += `Provinsi: ${allProvinces.map(p => p.name).join(', ')}\n`;
    wilayahHierarchy += `Kabupaten/Kota: ${allRegencies.map(r => r.name).join(', ')}\n`;
    wilayahHierarchy += `Kecamatan: ${districtsWithParents.map(d => d.name).join(', ')}\n`;
    wilayahHierarchy += `Desa/Kelurahan: ${villagesWithParents.map(v => v.name).join(', ')}\n`;

    wilayahHierarchy += `\n=== STRUKTUR HIERARKI (Induk Wilayah) ===\n`;
    villagesWithParents.forEach(v => {
      wilayahHierarchy += `- Desa ${v.name} -> Kec. ${v.district?.name} -> Kab. ${v.district?.regency?.name} -> Prov. ${v.district?.regency?.province?.name}\n`;
    });
    districtsWithParents.forEach(d => {
      wilayahHierarchy += `- Kec. ${d.name} -> Kab. ${d.regency?.name} -> Prov. ${d.regency?.province?.name}\n`;
    });

    const wilayahStats = {
      totalProvinces: allProvinces.length,
      totalRegencies: allRegencies.length,
      totalDistricts: districtsWithParents.length,
      totalVillages: villagesWithParents.length,
      hierarchy: wilayahHierarchy,
    };
    const context = await this.knowledgeService.getContext(scope, data.villageId);

    // Ambil data pengajuan surat
    let serviceRequests: any[] = [];
    let requestStats: { total: number; pending: number; verified: number; completed: number; rejected: number } | null = null;

    if (scope.role === 'CITIZEN') {
      serviceRequests = await this.prisma.serviceRequest.findMany({
        where: { applicantId: user.id, deletedAt: null },
        include: { serviceType: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    } else {
      const totalRequests = await this.prisma.serviceRequest.count({ where: { deletedAt: null } });
      const pendingRequests = await this.prisma.serviceRequest.count({ where: { status: 'PENDING', deletedAt: null } });
      const verifiedRequests = await this.prisma.serviceRequest.count({ where: { status: 'VERIFIED', deletedAt: null } });
      const completedRequests = await this.prisma.serviceRequest.count({ where: { status: 'COMPLETED', deletedAt: null } });
      const rejectedRequests = await this.prisma.serviceRequest.count({ where: { status: 'REJECTED', deletedAt: null } });

      serviceRequests = await this.prisma.serviceRequest.findMany({
        where: { deletedAt: null },
        include: { serviceType: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      requestStats = {
        total: totalRequests,
        pending: pendingRequests,
        verified: verifiedRequests,
        completed: completedRequests,
        rejected: rejectedRequests
      };
    }

        // Statistik akun user
    const totalSuperAdmin = await this.prisma.userRole.count({ where: { role: { name: 'SUPER_ADMIN' }, user: { deletedAt: null } } });
    const totalWarga = await this.prisma.userRole.count({ where: { role: { name: 'CITIZEN' }, user: { deletedAt: null } } });
    const totalRt = await this.prisma.userRole.count({ where: { role: { name: 'RT_ADMIN' }, user: { deletedAt: null } } });
    const totalRw = await this.prisma.userRole.count({ where: { role: { name: 'RW_ADMIN' }, user: { deletedAt: null } } });
    const totalAdminDesa = await this.prisma.userRole.count({ where: { role: { name: 'VILLAGE_ADMIN' }, user: { deletedAt: null } } });

    // ✅ TAMBAHKAN: Ambil daftar nama user (maksimal 50 agar aman dari limit token)
    const allUsers = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { name: true, roles: { select: { role: { select: { name: true } } } } },
      take: 50, 
      orderBy: { createdAt: 'desc' }
    });

    // Susun menjadi teks: "budi (CITIZEN), bapak nabil (SUPER_ADMIN), ..."
    const userList = allUsers.map(u => `${u.name} (${u.roles[0]?.role?.name || 'User'})`).join(', ');

    const userStats = {
      totalSuperAdmin,
      totalWarga,
      totalRt,
      totalRw,
      totalAdminDesa,
      totalSemua: totalSuperAdmin + totalWarga + totalRt + totalRw + totalAdminDesa,
      userList: userList // ✅ Masukkan daftar nama ke dalam object userStats
    };

    // Gabungkan context
    const enrichedContext = {
      ...context,
      aiSetting: setting,
      recentNews,
      recentAnnouncements,
      upcomingAgendas,
      recentPrograms,
      recentDocuments,
      wilayahStats,
      serviceRequests,
      requestStats,
      userStats, // userStats sekarang sudah berisi daftar nama
    };

    // Bangun prompt
    const systemPrompt = this.contextBuilder.buildSystemPrompt(scope, enrichedContext);
    const history = await this.getConversationHistory(conversation.id);
    const fullPrompt = this.contextBuilder.buildConversationPrompt(systemPrompt, history, data.message);

    let aiResponse = '';
    let tokensUsed = 0;
    const startTime = Date.now();

    try {
      // ==========================================
      // LOGIKA MULTI-PROVIDER (GEMINI & GROQ)
      // ==========================================

      if (
        modelToUse.includes('llama') ||
        modelToUse.includes('mixtral') ||
        modelToUse.includes('groq') ||
        modelToUse.includes('gpt-oss')
      ) {
        // Jalur GROQ
        if (!this.groq) throw new InternalServerErrorException('Groq API Key belum diatur di .env');

        const groqResponse = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: fullPrompt }],
          model: modelToUse,
        });

        aiResponse = groqResponse.choices[0]?.message?.content || '';
        tokensUsed = groqResponse.usage?.total_tokens || 0;
        this.logger.log(`✅ Dijawab oleh Groq (${modelToUse})`);
      } else {
        // Jalur GEMINI dengan fallback otomatis
        const geminiKeys = await this.getGeminiKeysForRequest(setting);
        if (geminiKeys.length === 0) {
          throw new InternalServerErrorException('Tidak ada API Key Gemini yang tersedia. Konfigurasikan melalui halaman Konfigurasi AI.');
        }

        const result = await this.callGeminiWithFallback(setting?.id || null, geminiKeys, modelToUse, fullPrompt);
        aiResponse = result.text;
        tokensUsed = result.totalTokenCount;
        this.logger.log(`✅ Dijawab oleh Gemini (${modelToUse})`);
      }
    } catch (error: any) {
      // Jangan log API Key asli
      this.logger.error(`❌ AI Error: ${error?.message || 'Unknown error'} [status=${error?.status}]`);

      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('safety') || msg.includes('block')) {
        throw new BadRequestException('Pertanyaan Anda melanggar kebijakan keamanan.');
      }
      if (msg.includes('api_key_invalid') || error?.status === 401) {
        throw new InternalServerErrorException('API Key tidak valid. Periksa konfigurasi API Key.');
      }
      if (error?.status === 429 || msg.includes('rate_limit') || msg.includes('quota')) {
        throw new BadRequestException('Semua API Key sedang dalam kondisi rate limit. Coba lagi dalam beberapa saat.');
      }
      if (error?.status === 503) {
        throw new BadRequestException('AI sedang tidak tersedia sementara. Coba lagi dalam beberapa saat.');
      }

      throw new InternalServerErrorException('Gagal memproses pertanyaan. Coba lagi.');
    }

    const responseTime = Date.now() - startTime;

    await this.prisma.aIMessage.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: 'USER',
          content: data.message,
        },
        {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: aiResponse,
          tokensUsed,
          responseTimeMs: responseTime,
          contextSources: {
            modelUsed: modelToUse,
            villageId: context?.village?.id || null,
            newsCount: recentNews.length,
            requestsCount: serviceRequests.length,
            totalRequests: requestStats?.total || 0,
            userStatsCount: userStats.totalSemua,
          } as any,
        },
      ],
    });

    if (conversation.title === 'New Conversation') {
      await this.prisma.aIConversation.update({
        where: { id: conversation.id },
        data: {
          title: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''),
        },
      });
    }

    return {
      conversationId: conversation.id,
      message: aiResponse,
      tokensUsed,
      responseTimeMs: responseTime,
    };
  }

  // ============================================
  // FUNGSI SETTING AI
  // ============================================
  async getAiSetting() {
    let setting = await this.prisma.aiSetting.findFirst();
    if (!setting) {
      setting = await this.prisma.aiSetting.create({ data: {} });
    }
    return setting;
  }

  async updateAiSetting(data: any) {
    const setting = await this.getAiSetting();
    // Jangan biarkan apiKeyConfig ditimpa melalui endpoint ini
    const { apiKeyConfig: _ignored, ...safeData } = data;
    return this.prisma.aiSetting.update({
      where: { id: setting.id },
      data: safeData,
    });
  }

  // ============================================
  // MANAJEMEN API KEY (DIGUNAKAN CONTROLLER)
  // ============================================

  async listApiKeys() {
    const setting = await this.getAiSetting();
    return this.apiKeyManager.listKeys(setting.id);
  }

  async upsertApiKey(data: {
    id?: string;
    label?: string;
    newRawKey?: string;
    isActive?: boolean;
    priority?: number;
  }) {
    const setting = await this.getAiSetting();
    return this.apiKeyManager.upsertKey(setting.id, data);
  }

  async deleteApiKey(keyId: string) {
    const setting = await this.getAiSetting();
    await this.apiKeyManager.deleteKey(setting.id, keyId);
    return { message: 'API Key berhasil dihapus.' };
  }

  async reorderApiKeys(orderedIds: string[]) {
    const setting = await this.getAiSetting();
    await this.apiKeyManager.reorderKeys(setting.id, orderedIds);
    return { message: 'Urutan API Key berhasil diperbarui.' };
  }

  async testSpecificKey(keyId: string, model?: string) {
    const setting = await this.getAiSetting();
    const keys = await this.apiKeyManager.getActiveRawKeys(setting.id);
    const keyEntry = keys.find((k) => k.id === keyId);

    if (!keyEntry) {
      return { status: 'error', message: 'Key tidak ditemukan atau tidak aktif.' };
    }

    const testModel = model || setting.aiModel || this.defaultModelName;
    const startTime = Date.now();
    try {
      const client = this.createGeminiClient(keyEntry.rawKey);
      const response = await client.models.generateContent({
        model: testModel,
        contents: 'Halo, tes koneksi. Jawab singkat: "OK"',
      });
      await this.apiKeyManager.updateKeyStatus(setting.id, keyId, 'ok');
      return {
        status: 'ok',
        message: 'Koneksi berhasil.',
        response: response.text,
        provider: 'Google Gemini',
        model: testModel,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      const isRateLimit = this.apiKeyManager.isRateLimitError(error);
      await this.apiKeyManager.updateKeyStatus(setting.id, keyId, 'error', isRateLimit);
      return {
        status: 'error',
        message: error?.message || 'Koneksi gagal.',
        provider: 'Google Gemini',
        model: testModel,
      };
    }
  }

  // ============================================
  // UJI KONEKSI (ENDPOINT LAMA, TETAP BERFUNGSI)
  // ============================================
  async testConnection(model?: string) {
    const setting = await this.getAiSetting();
    const testModel = model || setting.aiModel || this.defaultModelName;
    const geminiKeys = await this.getGeminiKeysForRequest(setting);

    if (geminiKeys.length === 0) {
      return {
        status: 'error',
        message: 'Tidak ada API Key Gemini yang tersedia.',
      };
    }

    const startTime = Date.now();
    let lastError: any = null;

    for (const keyEntry of geminiKeys) {
      try {
        const client = this.createGeminiClient(keyEntry.rawKey);
        const response = await client.models.generateContent({
          model: testModel,
          contents: 'Halo, tes koneksi. Jawab singkat: "OK"',
        });
        if (setting?.id && keyEntry.id) {
          this.apiKeyManager.updateKeyStatus(setting.id, keyEntry.id, 'ok').catch(() => { });
        }
        return {
          status: 'ok',
          message: 'Koneksi AI berhasil',
          response: response.text,
          provider: 'Google Gemini',
          model: testModel,
          responseTimeMs: Date.now() - startTime,
          keyLabel: keyEntry.label,
        };
      } catch (error: any) {
        lastError = error;
        if (setting?.id && keyEntry.id) {
          this.apiKeyManager.updateKeyStatus(setting.id, keyEntry.id, 'error', this.apiKeyManager.isRateLimitError(error)).catch(() => { });
        }
        // Tetap coba key berikutnya untuk test
      }
    }

    return {
      status: 'error',
      message: lastError?.message || 'Semua API Key gagal.',
    };
  }

  // ============================================
  // MANAJEMEN PERCAKAPAN (TIDAK DIUBAH)
  // ============================================
  async getConversations(userId: string) {
    return this.prisma.aIConversation.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
  }

  async getMessages(conversationId: string, userId: string) {
    const conversation = await this.prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      throw new BadRequestException('Percakapan tidak ditemukan');
    }

    return {
      id: conversation.id,
      title: conversation.title,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new BadRequestException('Percakapan tidak ditemukan');
    }

    await this.prisma.aIConversation.delete({ where: { id: conversationId } });
    return { message: 'Percakapan berhasil dihapus' };
  }

  private async getOrCreateConversation(
    userId: string,
    conversationId?: string,
    villageId?: string,
  ) {
    if (conversationId) {
      const existing = await this.prisma.aIConversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (existing) return existing;
    }

    return this.prisma.aIConversation.create({
      data: {
        userId,
        villageId,
        title: 'New Conversation',
        status: 'ACTIVE',
      },
    });
  }

  private async getConversationHistory(conversationId: string, limit: number = 10) {
    const messages = await this.prisma.aIMessage.findMany({
      where: {
        conversationId,
        role: { in: ['USER', 'ASSISTANT'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse().map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  private async checkRateLimit(userId: string) {
    const limit = parseInt(this.configService.get<string>('AI_RATE_LIMIT_PER_USER') || '10');
    const windowSeconds = parseInt(this.configService.get<string>('AI_RATE_LIMIT_WINDOW') || '60');

    const since = new Date(Date.now() - windowSeconds * 1000);

    const count = await this.prisma.aIMessage.count({
      where: {
        role: 'USER',
        createdAt: { gte: since },
        conversation: { userId },
      },
    });

    if (count >= limit) {
      throw new BadRequestException(
        `Terlalu banyak permintaan. Maksimal ${limit} pesan per ${windowSeconds} detik.`,
      );
    }
  }
}