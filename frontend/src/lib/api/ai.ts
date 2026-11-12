import { apiClient } from './client';

// ==================== TYPES ====================

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  tokensUsed: number;
  responseTimeMs: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface AiSetting {
  id: string;
  aiName: string;
  tone: 'FORMAL' | 'SANTAI';
  customPrompt: string | null;
  aiModel: string;
  updatedAt: string;
}

export interface UpdateAiSettingDto {
  aiName?: string;
  tone?: 'FORMAL' | 'SANTAI';
  customPrompt?: string | null;
  aiModel?: string;
}

// ==================== API KEY TYPES ====================

export interface ApiKeyEntry {
  id: string;
  label?: string;
  maskedKey: string;
  isActive: boolean;
  priority: number;
  status?: 'ok' | 'error' | 'untested';
  lastTestedAt?: string;
  cooldownUntil?: number;
}

export interface UpsertApiKeyDto {
  id?: string;         // Jika ada → update; jika tidak ada → tambah baru
  label?: string;
  newRawKey?: string;  // Kosong → pertahankan key lama
  isActive?: boolean;
  priority?: number;
}

export interface TestConnectionResult {
  status: string;
  message: string;
  response?: string;
  provider?: string;
  model?: string;
  responseTimeMs?: number;
  keyLabel?: string;
}

// ==================== API FUNCTIONS ====================

export const aiApi = {
  async chat(data: { message: string; conversationId?: string; villageId?: string; model?: string }): Promise<ChatResponse> {
    const response = await apiClient.post('/ai/chat', data);
    return response.data;
  },

  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get('/ai/conversations');
    return response.data;
  },

  async getConversation(id: string): Promise<ConversationDetail> {
    const response = await apiClient.get(`/ai/conversations/${id}`);
    return response.data;
  },

  async deleteConversation(id: string) {
    const response = await apiClient.delete(`/ai/conversations/${id}`);
    return response.data;
  },

  // ==================== KONFIGURASI AI (SUPER ADMIN) ====================

  async getSetting(): Promise<AiSetting> {
    const response = await apiClient.get('/ai/setting');
    return response.data;
  },

  async updateSetting(data: UpdateAiSettingDto): Promise<AiSetting> {
    const response = await apiClient.put('/ai/setting', data);
    return response.data;
  },

  async testConnection(model?: string): Promise<TestConnectionResult> {
    const params = model ? { model } : {};
    const response = await apiClient.get('/ai/test', { params });
    return response.data;
  },

  // ==================== MANAJEMEN API KEY (SUPER ADMIN) ====================

  /**
   * Ambil daftar semua API Key yang tersimpan (tersamarkan).
   */
  async listApiKeys(): Promise<ApiKeyEntry[]> {
    const response = await apiClient.get('/ai/keys');
    return response.data;
  },

  /**
   * Tambah key baru atau perbarui key yang sudah ada.
   * - Kirim `id` untuk update, tanpa `id` untuk tambah baru.
   * - Biarkan `newRawKey` kosong untuk mempertahankan key lama.
   */
  async upsertApiKey(data: UpsertApiKeyDto): Promise<ApiKeyEntry> {
    const response = await apiClient.put('/ai/keys', data);
    return response.data;
  },

  /**
   * Hapus satu API Key berdasarkan ID.
   */
  async deleteApiKey(keyId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/ai/keys/${keyId}`);
    return response.data;
  },

  /**
   * Perbarui urutan prioritas semua key sekaligus.
   */
  async reorderApiKeys(orderedIds: string[]): Promise<{ message: string }> {
    const response = await apiClient.patch('/ai/keys/reorder', { orderedIds });
    return response.data;
  },

  /**
   * Uji koneksi satu key tertentu berdasarkan ID-nya.
   */
  async testSpecificKey(keyId: string, model?: string): Promise<TestConnectionResult> {
    const params = model ? { model } : {};
    const response = await apiClient.post(`/ai/keys/${keyId}/test`, {}, { params });
    return response.data;
  },
};