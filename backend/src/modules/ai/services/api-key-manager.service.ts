import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Representasi satu API Key dalam sistem.
 */
export interface ApiKeyEntry {
  id: string;           // Identifier unik (uuid sederhana, generated di sini)
  label?: string;       // Label opsional: "Kunci Utama", "Cadangan #1", dll.
  maskedKey: string;    // Tampilan tersamarkan: "AIza...••••...AbCd"
  isActive: boolean;    // Apakah key ini aktif
  priority: number;     // 0 = primary, 1+ = fallback berurutan
  status?: 'ok' | 'error' | 'untested'; // Status uji koneksi terakhir
  lastTestedAt?: string;
  cooldownUntil?: number; // Timestamp ms; key tidak dicoba jika Date.now() < cooldownUntil
}

/**
 * Struktur penyimpanan internal di database (apiKeyConfig JSON)
 * Kunci asli TIDAK disimpan di field ini — disimpan terenkripsi.
 * Untuk proyek ini, kunci asli disimpan terenkripsi sederhana (base64 reversible)
 * agar tidak tersimpan plain-text, sambil tetap bisa dibaca backend.
 */
interface StoredApiKeyEntry {
  id: string;
  label?: string;
  encryptedKey: string; // base64-encoded key
  isActive: boolean;
  priority: number;
  status?: 'ok' | 'error' | 'untested';
  lastTestedAt?: string;
  cooldownUntil?: number;
}

interface ApiKeyConfig {
  keys: StoredApiKeyEntry[];
}

/** Error code yang memenuhi syarat fallback ke key berikutnya */
const FALLBACK_ELIGIBLE_CODES = new Set([429, 503, 500, 502, 504]);
const RATE_LIMIT_COOLDOWN_MS = 60_000; // 1 menit cooldown untuk 429

@Injectable()
export class ApiKeyManagerService {
  private readonly logger = new Logger(ApiKeyManagerService.name);

  constructor(private prisma: PrismaService) {}

  // ==============================
  // ENKRIPSI SEDERHANA (reversible)
  // ==============================

  private encryptKey(raw: string): string {
    return Buffer.from(raw, 'utf8').toString('base64');
  }

  private decryptKey(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('utf8');
  }

  private maskKey(raw: string): string {
    if (!raw || raw.length < 8) return '••••••••';
    const prefix = raw.substring(0, 6);
    const suffix = raw.substring(raw.length - 4);
    return `${prefix}••••••••${suffix}`;
  }

  private generateId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  // ==============================
  // BACA KONFIGURASI KEY DARI DB
  // ==============================

  private async getStoredConfig(settingId: string): Promise<ApiKeyConfig> {
    const setting = await this.prisma.aiSetting.findUnique({ where: { id: settingId } });
    if (!setting || !setting.apiKeyConfig) {
      return { keys: [] };
    }
    return setting.apiKeyConfig as unknown as ApiKeyConfig;
  }

  /**
   * Kembalikan daftar key dalam bentuk aman (tersamarkan) untuk frontend.
   */
  async listKeys(settingId: string): Promise<ApiKeyEntry[]> {
    const config = await this.getStoredConfig(settingId);
    return config.keys
      .sort((a, b) => a.priority - b.priority)
      .map((k) => ({
        id: k.id,
        label: k.label,
        maskedKey: k.encryptedKey ? this.maskKey(this.decryptKey(k.encryptedKey)) : '(belum diatur)',
        isActive: k.isActive,
        priority: k.priority,
        status: k.status || 'untested',
        lastTestedAt: k.lastTestedAt,
        cooldownUntil: k.cooldownUntil,
      }));
  }

  /**
   * Tambah atau perbarui API Key.
   * - Jika `id` tidak ada → buat key baru.
   * - Jika `id` ada dan `newRawKey` kosong → pertahankan key lama.
   * - Jika `id` ada dan `newRawKey` diisi → ganti key lama.
   */
  async upsertKey(
    settingId: string,
    data: {
      id?: string;
      label?: string;
      newRawKey?: string;
      isActive?: boolean;
      priority?: number;
    },
  ): Promise<ApiKeyEntry> {
    const config = await this.getStoredConfig(settingId);

    const existingIndex = data.id ? config.keys.findIndex((k) => k.id === data.id) : -1;

    if (existingIndex >= 0) {
      // UPDATE key yang sudah ada
      const existing = config.keys[existingIndex];
      if (data.newRawKey && data.newRawKey.trim().length > 0) {
        existing.encryptedKey = this.encryptKey(data.newRawKey.trim());
        existing.status = 'untested';
        existing.lastTestedAt = undefined;
      }
      if (data.label !== undefined) existing.label = data.label;
      if (data.isActive !== undefined) existing.isActive = data.isActive;
      if (data.priority !== undefined) existing.priority = data.priority;
      config.keys[existingIndex] = existing;
    } else {
      // TAMBAH key baru
      if (!data.newRawKey || data.newRawKey.trim().length === 0) {
        throw new Error('API Key tidak boleh kosong saat menambahkan kunci baru.');
      }
      const newEntry: StoredApiKeyEntry = {
        id: this.generateId(),
        label: data.label || `Kunci #${config.keys.length + 1}`,
        encryptedKey: this.encryptKey(data.newRawKey.trim()),
        isActive: data.isActive !== undefined ? data.isActive : true,
        priority: data.priority !== undefined ? data.priority : config.keys.length,
        status: 'untested',
      };
      config.keys.push(newEntry);
    }

    // Re-normalisasi priority agar berurutan
    config.keys.sort((a, b) => a.priority - b.priority);
    config.keys.forEach((k, i) => { k.priority = i; });

    await this.saveConfig(settingId, config);

    const saved = config.keys.find((k) => k.id === (data.id || config.keys[config.keys.length - 1].id));
    return {
      id: saved!.id,
      label: saved!.label,
      maskedKey: this.maskKey(this.decryptKey(saved!.encryptedKey)),
      isActive: saved!.isActive,
      priority: saved!.priority,
      status: saved!.status || 'untested',
    };
  }

  /**
   * Hapus satu API Key dari konfigurasi.
   */
  async deleteKey(settingId: string, keyId: string): Promise<void> {
    const config = await this.getStoredConfig(settingId);
    config.keys = config.keys.filter((k) => k.id !== keyId);
    // Re-normalisasi priority
    config.keys.sort((a, b) => a.priority - b.priority);
    config.keys.forEach((k, i) => { k.priority = i; });
    await this.saveConfig(settingId, config);
  }

  /**
   * Perbarui urutan prioritas sekaligus.
   */
  async reorderKeys(settingId: string, orderedIds: string[]): Promise<void> {
    const config = await this.getStoredConfig(settingId);
    orderedIds.forEach((id, idx) => {
      const key = config.keys.find((k) => k.id === id);
      if (key) key.priority = idx;
    });
    await this.saveConfig(settingId, config);
  }

  /**
   * Perbarui status key setelah uji koneksi atau setelah fallback.
   */
  async updateKeyStatus(
    settingId: string,
    keyId: string,
    status: 'ok' | 'error' | 'untested',
    setCooldown?: boolean,
  ): Promise<void> {
    const config = await this.getStoredConfig(settingId);
    const key = config.keys.find((k) => k.id === keyId);
    if (!key) return;
    key.status = status;
    key.lastTestedAt = new Date().toISOString();
    if (setCooldown && status === 'error') {
      key.cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
    } else {
      key.cooldownUntil = undefined;
    }
    await this.saveConfig(settingId, config);
  }

  // ==============================
  // DAPATKAN KEY AKTIF UNTUK FALLBACK
  // ==============================

  /**
   * Ambil daftar raw key aktif yang siap digunakan (belum dalam cooldown),
   * berurutan berdasarkan priority. TIDAK mengembalikan key termasarkan.
   * Hanya untuk penggunaan internal backend.
   */
  async getActiveRawKeys(settingId: string): Promise<Array<{ id: string; rawKey: string; label?: string }>> {
    const config = await this.getStoredConfig(settingId);
    const now = Date.now();
    return config.keys
      .filter((k) => k.isActive && k.encryptedKey)
      .filter((k) => !k.cooldownUntil || now >= k.cooldownUntil)
      .sort((a, b) => a.priority - b.priority)
      .map((k) => ({
        id: k.id,
        rawKey: this.decryptKey(k.encryptedKey),
        label: k.label,
      }));
  }

  // ==============================
  // UTILITAS
  // ==============================

  private async saveConfig(settingId: string, config: ApiKeyConfig): Promise<void> {
    await this.prisma.aiSetting.update({
      where: { id: settingId },
      data: { apiKeyConfig: config as any },
    });
  }

  /**
   * Apakah error HTTP tersebut memenuhi syarat untuk mencoba key berikutnya?
   */
   isRetryableWithNextKey(error: any): boolean {
    // 1. Cek jika ada status/numeric code
    const status = error?.status || (typeof error?.code === 'number' ? error?.code : null);
    if (typeof status === 'number') {
      return FALLBACK_ELIGIBLE_CODES.has(status);
    }

    // 2. Ambil pesan error (jika ada) dan ubah ke huruf kecil
    const msg = (error?.message || '').toLowerCase();
    
    // 3. Cek Error Rate Limit / Quota
    if (msg.includes('rate_limit') || msg.includes('quota')) return true;
    
    // 4. Cek Error Server (503, 500)
    if (msg.includes('service_unavailable') || msg.includes('503')) return true;
    if (msg.includes('internal_server_error') || msg.includes('500')) return true;
    
    // 5. Cek Error Kredensial (Invalid Key)
    if (msg.includes('api_key_invalid') || msg.includes('401') || msg.includes('403')) return true;

    // ✅ 6. CEK ERROR JARINGAN / TIMEOUT (PENYEBAB FETCH FAILED)
    if (
      msg.includes('fetch failed') || 
      msg.includes('timeout') || 
      msg.includes('network') || 
      msg.includes('econnreset') ||
      msg.includes('enotfound')
    ) {
      return true;
    }

    // Cek khusus kode bawaan Node.js (undici)
    if (
      error?.code === 'UND_ERR_CONNECT_TIMEOUT' || 
      error?.code === 'UND_ERR_SOCKET'
    ) {
      return true;
    }

    return false;
  }

  /**
   * Apakah error ini disebabkan rate limit sehingga perlu cooldown?
   */
  isRateLimitError(error: any): boolean {
    const status = error?.status;
    if (status === 429) return true;
    const msg = (error?.message || '').toLowerCase();
    return msg.includes('rate_limit') || msg.includes('quota') || msg.includes('429');
  }

  /**
   * Apakah error ini tidak perlu retry sama sekali (kesalahan input/prompt)?
   */
  isNonRetryableError(error: any): boolean {
    const status = error?.status;
    // Safety block: jangan retry, ini masalah konten bukan key
    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('safety') || msg.includes('block')) return true;
    // Bad request karena konten: jangan retry
    if (status === 400) return true;
    return false;
  }
}
