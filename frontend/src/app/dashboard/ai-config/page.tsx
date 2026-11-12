'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { aiApi, AiSetting, UpdateAiSettingDto, ApiKeyEntry, UpsertApiKeyDto } from '@/lib/api/ai';

// ========================================
// MODEL DEFINITIONS — termasuk Gemini 3.x
// ========================================

const GEMINI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Direkomendasikan)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Paling Akurat)' },
  { value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (Baru)' },
  { value: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash (Baru)' },
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Baru)' },
  { value: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite' },
  { value: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite' },
  { value: 'gemini-3.5-flash', label: 'gemini-3.5-flash' },
];

const GROQ_MODELS = [
  { value: 'llama-3.1-8b-instant', label: 'LLaMA 3.1 8B Instant (Via Groq)' },
  { value: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B Versatile (Via Groq)' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Via Groq)' },
];

const ALL_MODELS = [
  { group: '🟢 Google Gemini', models: GEMINI_MODELS },
  { group: '🟣 Groq (Open Source)', models: GROQ_MODELS },
];

function getProviderFromModel(model: string): string {
  if (model.includes('llama') || model.includes('mixtral') || model.includes('groq')) return 'groq';
  return 'gemini';
}

// ========================================
// KOMPONEN UTILITAS
// ========================================

function StatusBadge({ status, label }: { status: 'ok' | 'error' | 'idle' | 'loading' | 'untested'; label: string }) {
  const styles = {
    ok: 'bg-green-100 text-green-700 border-green-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    idle: 'bg-gray-100 text-gray-500 border-gray-200',
    loading: 'bg-blue-100 text-blue-700 border-blue-200',
    untested: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };
  const icons = { ok: '✅', error: '❌', idle: '⚪', loading: '⏳', untested: '🔲' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${styles[status]}`}>
      <span>{icons[status]}</span>
      {label}
    </span>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-md flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ========================================
// KOMPONEN: API KEY ITEM DALAM DAFTAR
// ========================================

interface ApiKeyItemProps {
  entry: ApiKeyEntry;
  index: number;
  onEdit: (entry: ApiKeyEntry) => void;
  onDelete: (id: string, label?: string) => void;
  onTest: (id: string) => void;
  testingKeyId: string | null;
  testResults: Record<string, { status: 'ok' | 'error'; message: string; responseTimeMs?: number }>;
}

function ApiKeyItem({ entry, index, onEdit, onDelete, onTest, testingKeyId, testResults }: ApiKeyItemProps) {
  const isTesting = testingKeyId === entry.id;
  const testResult = testResults[entry.id];
  const priorityLabel = index === 0 ? 'Kunci Utama' : `Fallback #${index}`;

  return (
    <div className={`border rounded-xl p-4 transition-all ${entry.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
      <div className="flex items-start gap-3">
        {/* Drag handle / nomor urut */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0 mt-0.5">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 text-sm">{entry.label || priorityLabel}</span>
            {index === 0 && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Utama</span>
            )}
            {!entry.isActive && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Dinonaktifkan</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono truncate max-w-xs">
              {entry.maskedKey}
            </code>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {entry.status && (
              <StatusBadge
                status={entry.status === 'untested' ? 'untested' : entry.status}
                label={entry.status === 'ok' ? 'Terkoneksi' : entry.status === 'error' ? 'Gagal' : 'Belum diuji'}
              />
            )}
            {entry.lastTestedAt && (
              <span className="text-xs text-gray-400">
                Diuji: {new Date(entry.lastTestedAt).toLocaleString('id-ID')}
              </span>
            )}
            {entry.cooldownUntil && Date.now() < entry.cooldownUntil && (
              <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                ⏳ Rate limit — cooldown aktif
              </span>
            )}
          </div>

          {testResult && (
            <div className={`mt-2 text-xs p-2 rounded-lg ${testResult.status === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testResult.status === 'ok'
                ? `✅ Koneksi berhasil${testResult.responseTimeMs ? ` (${testResult.responseTimeMs}ms)` : ''}`
                : `❌ ${testResult.message}`}
            </div>
          )}
        </div>

        {/* Tombol aksi */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            id={`btn-test-key-${entry.id}`}
            onClick={() => onTest(entry.id)}
            disabled={isTesting}
            title="Uji koneksi key ini"
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 text-sm"
          >
            {isTesting ? <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin block" /> : '🔌'}
          </button>
          <button
            id={`btn-edit-key-${entry.id}`}
            onClick={() => onEdit(entry)}
            title="Edit key ini"
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-sm"
          >
            ✏️
          </button>
          <button
            id={`btn-delete-key-${entry.id}`}
            onClick={() => onDelete(entry.id, entry.label)}
            title="Hapus key ini"
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all text-sm"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// KOMPONEN: MODAL TAMBAH / EDIT KEY
// ========================================

interface KeyModalProps {
  entry: ApiKeyEntry | null; // null = tambah baru
  onSave: (data: UpsertApiKeyDto) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function KeyModal({ entry, onSave, onClose, saving }: KeyModalProps) {
  const isEdit = !!entry;
  const [label, setLabel] = useState(entry?.label || '');
  const [newRawKey, setNewRawKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isActive, setIsActive] = useState(entry?.isActive !== false);

  const handleSubmit = async () => {
    // Validasi: kalau tambah baru, key wajib diisi
    if (!isEdit && !newRawKey.trim()) {
      alert('API Key tidak boleh kosong.');
      return;
    }
    await onSave({
      id: entry?.id,
      label: label.trim() || undefined,
      newRawKey: newRawKey.trim() || undefined,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {isEdit ? '✏️ Edit API Key' : '➕ Tambah API Key Baru'}
        </h3>

        <div className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Label <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <input
              id="key-label-input"
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="contoh: Kunci Utama, Cadangan Proyek A"
              maxLength={60}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              API Key {!isEdit && <span className="text-red-500">*</span>}
              {isEdit && <span className="text-gray-400 font-normal ml-1">(kosongkan untuk mempertahankan key lama)</span>}
            </label>
            <div className="relative">
              <input
                id="key-value-input"
                type={showKey ? 'text' : 'password'}
                value={newRawKey}
                onChange={e => setNewRawKey(e.target.value)}
                placeholder={isEdit ? 'Masukkan key baru (opsional)' : 'AIza... atau kunci API lengkap'}
                className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            {isEdit && entry?.maskedKey && (
              <p className="text-xs text-gray-400 mt-1">Key saat ini: <code className="bg-gray-100 px-1 rounded">{entry.maskedKey}</code></p>
            )}
          </div>

          {/* Status aktif */}
          <div className="flex items-center gap-3">
            <button
              id="key-active-toggle"
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <label className="text-sm text-gray-700">
              {isActive ? 'Key aktif (akan digunakan)' : 'Key dinonaktifkan (tidak akan digunakan)'}
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            id="key-modal-cancel"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            Batal
          </button>
          <button
            id="key-modal-save"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
            ) : (
              <>{isEdit ? '💾 Simpan Perubahan' : '➕ Tambah Key'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// HALAMAN UTAMA
// ========================================

export default function AiConfigPage() {
  const router = useRouter();

  const [form, setForm] = useState<UpdateAiSettingDto>({
    aiName: 'Asisten Desa',
    tone: 'FORMAL',
    aiModel: 'gemini-2.5-flash',
    customPrompt: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<UpdateAiSettingDto | null>(null);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<'ok' | 'error' | 'idle' | 'loading'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  // --- State untuk manajemen API Key ---
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKeyEntry | null>(null);
  const [keySaving, setKeySaving] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [keyTestResults, setKeyTestResults] = useState<Record<string, { status: 'ok' | 'error'; message: string; responseTimeMs?: number }>>({});

  const activeProvider = getProviderFromModel(form.aiModel || '');

  // Cek akses
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) { router.push('/login'); return; }
    const parsed = JSON.parse(user);
    if (parsed.role !== 'SUPER_ADMIN') router.push('/dashboard');
  }, [router]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // --- Load setting & API keys ---
  const loadSetting = useCallback(async () => {
    setLoading(true);
    try {
      const data: AiSetting = await aiApi.getSetting();
      const snapshot: UpdateAiSettingDto = {
        aiName: data.aiName,
        tone: data.tone,
        aiModel: data.aiModel,
        customPrompt: data.customPrompt || '',
      };
      setForm(snapshot);
      setSavedSnapshot(snapshot);
      setIsDirty(false);
    } catch {
      showNotification('error', 'Gagal memuat konfigurasi AI. Periksa koneksi backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApiKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const keys = await aiApi.listApiKeys();
      setApiKeys(keys);
    } catch {
      // Tidak error kritis — keys mungkin belum diatur
      setApiKeys([]);
    } finally {
      setKeysLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSetting();
    loadApiKeys();
  }, [loadSetting, loadApiKeys]);

  // --- Handlers form utama ---
  const handleChange = (field: keyof UpdateAiSettingDto, value: string | null) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleReset = () => {
    if (savedSnapshot) {
      setForm(savedSnapshot);
      setIsDirty(false);
      showNotification('info', 'Perubahan dibatalkan. Konfigurasi dikembalikan ke versi tersimpan.');
    }
  };

  const handleSave = async () => {
    if (!form.aiName?.trim()) { showNotification('error', 'Nama AI tidak boleh kosong.'); return; }
    if (!form.aiModel?.trim()) { showNotification('error', 'Model AI harus dipilih.'); return; }
    setSaving(true);
    try {
      const payload: UpdateAiSettingDto = {
        aiName: form.aiName?.trim(),
        tone: form.tone,
        aiModel: form.aiModel?.trim(),
        customPrompt: form.customPrompt?.trim() || null,
      };
      await aiApi.updateSetting(payload);
      setSavedSnapshot(payload);
      setIsDirty(false);
      showNotification('success', 'Konfigurasi AI berhasil disimpan!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menyimpan konfigurasi.';
      showNotification('error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus('loading');
    setConnectionMessage('Menguji koneksi...');
    try {
      const result = await aiApi.testConnection(form.aiModel);
      if (result.status === 'ok') {
        setConnectionStatus('ok');
        setConnectionMessage(
          `Koneksi berhasil! Model: ${result.model || '-'}, Provider: ${result.provider || '-'}${result.responseTimeMs ? `, Waktu respons: ${result.responseTimeMs}ms` : ''}${result.keyLabel ? `, Key: ${result.keyLabel}` : ''}. Respons: "${result.response}"`
        );
      } else {
        setConnectionStatus('error');
        setConnectionMessage(result.message || 'Koneksi gagal.');
      }
    } catch {
      setConnectionStatus('error');
      setConnectionMessage('Gagal menghubungi backend. Pastikan backend berjalan.');
    } finally {
      setTesting(false);
    }
  };

  // --- Handlers API Key ---
  const handleOpenAddKey = () => {
    setEditingKey(null);
    setKeyModalOpen(true);
  };

  const handleOpenEditKey = (entry: ApiKeyEntry) => {
    setEditingKey(entry);
    setKeyModalOpen(true);
  };

  const handleSaveKey = async (data: UpsertApiKeyDto) => {
    setKeySaving(true);
    try {
      await aiApi.upsertApiKey(data);
      await loadApiKeys();
      setKeyModalOpen(false);
      showNotification('success', data.id ? 'API Key berhasil diperbarui.' : 'API Key berhasil ditambahkan.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan API Key.';
      showNotification('error', msg);
    } finally {
      setKeySaving(false);
    }
  };

  const handleDeleteKey = async (keyId: string, label?: string) => {
    if (!confirm(`Hapus API Key "${label || keyId}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await aiApi.deleteApiKey(keyId);
      await loadApiKeys();
      showNotification('success', 'API Key berhasil dihapus.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menghapus API Key.';
      showNotification('error', msg);
    }
  };

  const handleTestKey = async (keyId: string) => {
    setTestingKeyId(keyId);
    try {
      const result = await aiApi.testSpecificKey(keyId, form.aiModel);
      setKeyTestResults(prev => ({
        ...prev,
        [keyId]: {
          status: result.status === 'ok' ? 'ok' : 'error',
          message: result.message,
          responseTimeMs: result.responseTimeMs,
        },
      }));
      // Refresh status dari server
      await loadApiKeys();
    } catch {
      setKeyTestResults(prev => ({
        ...prev,
        [keyId]: { status: 'error', message: 'Gagal menghubungi backend.' },
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-xl w-72" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <span className="text-4xl">🧠</span>
            Konfigurasi AI
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Kelola pengaturan mesin AI untuk chatbot desa. Hanya dapat diakses oleh Super Admin.
          </p>
        </div>
        {isDirty && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
            <span>⚠️</span>
            <span>Ada perubahan yang belum disimpan</span>
          </div>
        )}
      </div>

      {/* NOTIFIKASI */}
      {notification && (
        <div className={`flex items-start gap-3 px-5 py-4 rounded-xl border text-sm font-medium animate-fade-in ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
          'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <span className="text-lg leading-none mt-0.5">
            {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="flex-1">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* SEKSI 1: IDENTITAS AI */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <SectionHeader
          icon="🤖"
          title="Identitas Chatbot"
          subtitle="Nama dan gaya bahasa yang digunakan oleh chatbot ketika merespons pengguna."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nama Chatbot <span className="text-red-500">*</span>
            </label>
            <input
              id="ai-name-input"
              type="text"
              value={form.aiName || ''}
              onChange={e => handleChange('aiName', e.target.value)}
              placeholder="contoh: Asisten Desa Maju"
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800"
            />
            <p className="text-xs text-gray-400 mt-1">Nama ini digunakan saat AI menyapa pengguna.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Gaya Bahasa <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'FORMAL', label: '👔 Formal', desc: 'Resmi seperti pegawai pemerintah' },
                { value: 'SANTAI', label: '😊 Santai', desc: 'Akrab seperti teman ngobrol' },
              ].map(opt => (
                <button
                  key={opt.value}
                  id={`tone-${opt.value.toLowerCase()}`}
                  onClick={() => handleChange('tone', opt.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.tone === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                  }`}
                >
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEKSI 2: MODEL AI */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <SectionHeader
          icon="⚙️"
          title="Model & Provider AI"
          subtitle="Pilih model yang akan digunakan oleh chatbot. Model Gemini 3.x tersedia jika akun Anda mendukung."
        />
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm text-gray-600 dark:text-gray-400">Provider aktif:</span>
          <StatusBadge status="ok" label={activeProvider === 'gemini' ? 'Google Gemini' : 'Groq (Open Source)'} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Model AI <span className="text-red-500">*</span>
          </label>
          <select
            id="ai-model-select"
            value={form.aiModel || ''}
            onChange={e => handleChange('aiModel', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800"
          >
            {ALL_MODELS.map(group => (
              <optgroup key={group.group} label={group.group}>
                {group.models.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-2">
            Model Groq menggunakan GROQ_API_KEY dari <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">.env</code>.
            Model Gemini menggunakan API Key yang dikonfigurasi di bawah. Model 3.x memerlukan akses API yang mendukungnya.
          </p>
        </div>

        {/* Uji Koneksi */}
        <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Uji Koneksi AI (Semua Key)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Menguji koneksi menggunakan model dan API Key yang dikonfigurasi, dengan fallback otomatis.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <StatusBadge
                status={connectionStatus}
                label={
                  connectionStatus === 'idle' ? 'Belum diuji' :
                  connectionStatus === 'loading' ? 'Menguji...' :
                  connectionStatus === 'ok' ? 'Terhubung' : 'Gagal'
                }
              />
              <button
                id="btn-test-connection"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {testing ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menguji...</>
                ) : (
                  <><span>🔌</span>Uji Koneksi</>
                )}
              </button>
            </div>
          </div>
          {connectionMessage && connectionStatus !== 'loading' && (
            <div className={`mt-3 text-xs p-3 rounded-lg ${
              connectionStatus === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {connectionMessage}
            </div>
          )}
        </div>
      </div>

      {/* SEKSI 3: MANAJEMEN API KEY */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <SectionHeader
          icon="🔑"
          title="Daftar API Key AI (Sistem Fallback Otomatis)"
          subtitle="Kelola API Key utama dan cadangan. Chatbot akan otomatis mencoba key berikutnya jika terjadi rate limit atau error."
        />

        {/* Cara kerja fallback */}
        <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-semibold text-sm mb-1">ℹ️ Cara kerja fallback:</p>
          <p>1. Chatbot menggunakan <strong>Kunci #1 (Utama)</strong> terlebih dahulu.</p>
          <p>2. Jika terjadi rate limit (HTTP 429), error server (5xx), atau kredensial tidak valid (401/403), sistem mencoba kunci berikutnya secara otomatis.</p>
          <p>3. Jika semua kunci gagal, pengguna mendapatkan pesan error yang informatif.</p>
          <p>4. Kunci yang terkena rate limit mendapat cooldown 60 detik sebelum dicoba lagi.</p>
        </div>

        {keysLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-4xl mb-3">🔑</p>
            <p className="text-gray-600 font-semibold">Belum ada API Key yang tersimpan di database</p>
            <p className="text-gray-400 text-sm mt-1">Sistem akan menggunakan GEMINI_API_KEY dari file .env sebagai fallback.</p>
            <p className="text-gray-400 text-sm">Tambahkan key di sini untuk menggunakan fitur fallback otomatis.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((entry, index) => (
              <ApiKeyItem
                key={entry.id}
                entry={entry}
                index={index}
                onEdit={handleOpenEditKey}
                onDelete={handleDeleteKey}
                onTest={handleTestKey}
                testingKeyId={testingKeyId}
                testResults={keyTestResults}
              />
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            id="btn-add-api-key"
            onClick={handleOpenAddKey}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
          >
            <span>➕</span>
            Tambah API Key Cadangan
          </button>
          <button
            id="btn-refresh-keys"
            onClick={loadApiKeys}
            disabled={keysLoading}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Info tentang .env fallback */}
        {apiKeys.length === 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-700">
            <strong>💡 Catatan:</strong> Saat tidak ada key di database, sistem menggunakan <code className="bg-amber-100 px-1 rounded">GEMINI_API_KEY</code> dari file <code className="bg-amber-100 px-1 rounded">.env</code> sebagai key tunggal tanpa fallback.
          </div>
        )}
      </div>

      {/* SEKSI 4: SYSTEM PROMPT */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <SectionHeader
          icon="📝"
          title="Instruksi Khusus (System Prompt)"
          subtitle="Instruksi tambahan yang disisipkan pada prompt sistem AI. Aturan keamanan dasar tetap diberlakukan oleh backend."
        />
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Instruksi Tambahan
            <span className="text-gray-400 font-normal ml-2">(opsional)</span>
          </label>
          <textarea
            id="ai-custom-prompt-input"
            value={form.customPrompt || ''}
            onChange={e => handleChange('customPrompt', e.target.value)}
            rows={6}
            placeholder={"Contoh:\n- Selalu awali jawaban dengan salam.\n- Fokus pada informasi layanan surat menyurat.\n- Jika tidak tahu, sarankan menghubungi kantor desa."}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 resize-y text-sm font-mono"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-400">Instruksi ini ditambahkan ke sistem prompt utama. Aturan keamanan tetap diberlakukan backend.</p>
            <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{(form.customPrompt || '').length} karakter</p>
          </div>
        </div>
        <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
            <span>🔒</span> Aturan Keamanan yang Selalu Aktif
          </p>
          <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
            <li>AI hanya menjawab berdasarkan data yang tersedia di sistem</li>
            <li>Data pribadi (NIK, nomor KK, dll.) tidak pernah ditampilkan</li>
            <li>Akses data disesuaikan dengan role pengguna yang login</li>
            <li>AI tidak boleh mengarang atau menebak informasi</li>
          </ul>
        </div>
      </div>

      {/* SEKSI 5: INFO PENYIMPANAN */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💾</span>
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Tentang Penyimpanan Konfigurasi</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Konfigurasi disimpan di tabel <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">ai_settings</code> pada database.
              API Key disimpan terenkripsi dalam kolom <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">apiKeyConfig</code>.
              API Key asli tidak pernah dikirimkan ke frontend.
              Perubahan langsung berlaku pada percakapan AI berikutnya.
            </p>
          </div>
        </div>
      </div>

      {/* TOMBOL AKSI */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            id="btn-reset-config"
            onClick={handleReset}
            disabled={!isDirty || saving}
            className="w-full sm:w-auto px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <span>↩️</span> Reset Perubahan
          </button>
          <button
            id="btn-save-config"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
            ) : (
              <><span>💾</span>Simpan Konfigurasi AI</>
            )}
          </button>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT KEY */}
      {keyModalOpen && (
        <KeyModal
          entry={editingKey}
          onSave={handleSaveKey}
          onClose={() => setKeyModalOpen(false)}
          saving={keySaving}
        />
      )}

    </div>
  );
}
