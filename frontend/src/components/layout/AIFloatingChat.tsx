'use client';

import { useEffect, useRef, useState } from 'react';
import { aiApi } from '@/lib/api/ai';
import { regionsApi } from '@/lib/api/regions';
import { showConfirm } from '@/lib/swal';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt?: string;
  isLoading?: boolean;
  tokensUsed?: number;
  responseTimeMs?: number;
}

export default function AIFloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserRole(parsed.role);
      setUserName(parsed.name || 'User');
      if (parsed.villageId) setSelectedVillage(parsed.villageId);
    }
  }, []);

  useEffect(() => {
    if (userRole === 'SUPER_ADMIN') {
      regionsApi.getVillages().then((data) => {
        setVillages(data);
        if (data.length > 0 && !selectedVillage) setSelectedVillage(data[0].id);
      }).catch(console.error);
    }
  }, [userRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!selectedVillage) { setError('Pilih desa terlebih dahulu'); return; }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: 'loading-' + Date.now(), role: 'ASSISTANT', content: '', isLoading: true },
    ]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      // ✅ Parameter 'model' dihapus, backend akan menggunakan setting dari database
      const response = await aiApi.chat({
        message: userMessage.content,
        conversationId: conversationId || undefined,
        villageId: selectedVillage,
      });
      setConversationId(response.conversationId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isLoading
            ? {
                id: Date.now().toString(),
                role: 'ASSISTANT' as const,
                content: response.message,
                createdAt: new Date().toISOString(),
                tokensUsed: response.tokensUsed,
                responseTimeMs: response.responseTimeMs,
              }
            : msg,
        ),
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim pesan');
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = async () => {
    const result = await showConfirm(
      'Hapus Percakapan?',
      'Semua riwayat obrolan Anda dengan AI akan dihapus permanen.'
    );

    if (result.isConfirmed) {
      setMessages([]);
      setConversationId(null);
      setError('');
    }
  };

  const formatTime = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // ✅ FUNGSI UNTUK MERAPIKAN FORMAT TEKS DARI AI
  const formatContent = (text: string) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
    formatted = formatted.replace(/^\* (.*?)$/gm, '• $1'); // Bullet points
    formatted = formatted.replace(/\n/g, '<br/>'); // Baris baru
    return formatted;
  };

  const suggestions = [
    { icon: '👥', text: 'Berapa jumlah penduduk desa?' },
    { icon: '🎯', text: 'Apa visi dan misi desa?' },
    { icon: '👔', text: 'Siapa saja perangkat desa?' },
    { icon: '📋', text: 'Apa program kerja yang sedang berjalan?' },
    { icon: '📰', text: 'Ringkasan berita terbaru' },
    { icon: '📅', text: 'Agenda apa yang akan datang?' },
  ];

  const btnDisabled = loading || !input.trim() || !selectedVillage;

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="ai-float-panel">
          {/* Header */}
          <div className="ai-float-header flex justify-between items-center">
            <div className="ai-float-header-left">
              <div className="ai-float-avatar">🤖</div>
              <div>
                <p className="ai-float-title">AI Assistant</p>
                <p className="ai-float-status">
                  <span className="ai-float-dot" /> Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {userRole === 'SUPER_ADMIN' && (
                <select
                  className="text-xs bg-white/20 text-white rounded-lg px-2 py-1 outline-none border border-white/30"
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                >
                  {villages.map((v: any) => (
                    <option key={v.id} value={v.id} className="text-black">{v.name}</option>
                  ))}
                </select>
              )}

              {/* ✅ Tombol Bersihkan */}
              <button className="ai-float-icon-btn" onClick={handleClear} title="Bersihkan">🗑️</button>

              <button className="ai-float-icon-btn" onClick={() => setIsOpen(false)} title="Tutup">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-float-messages">
            {messages.length === 0 ? (
              <div className="ai-float-welcome">
                <div className="ai-float-welcome-icon">🤖</div>
                <h3 className="ai-float-welcome-title">Halo, {userName}! 👋</h3>
                <p className="ai-float-welcome-sub">Tanyakan apa saja tentang desa/kelurahan</p>
                <div className="ai-float-suggestions">
                  {suggestions.map((q) => (
                    <button
                      key={q.text}
                      className="ai-float-suggestion-btn"
                      onClick={() => setInput(q.text)}
                    >
                      <span>{q.icon}</span>
                      <span>{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`ai-float-msg-row ${msg.role === 'USER' ? 'user' : 'ai'}`}>
                    {msg.role === 'ASSISTANT' && <div className="ai-float-msg-avatar">🤖</div>}
                    <div className="ai-float-msg-content">
                      <div className={`ai-float-bubble ${msg.role === 'USER' ? 'user' : 'ai'}`}>
                        {msg.isLoading ? (
                          <div className="ai-float-typing">
                            <span /><span /><span />
                          </div>
                        ) : (
                          // ✅ Gunakan dangerouslySetInnerHTML agar format teks rapi
                          <div 
                            className="prose prose-sm max-w-none text-sm"
                            dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} 
                          />
                        )}
                      </div>
                      {!msg.isLoading && msg.createdAt && (
                        <div className={`ai-float-meta ${msg.role === 'USER' ? 'user' : 'ai'}`}>
                          <span>{formatTime(msg.createdAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="ai-float-error">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* ✅ Area Input (Bersih, Tanpa Dropdown Model) */}
          <div className="ai-float-input-area p-3 bg-gray-50 border-t">
            <div className="flex items-center gap-2 bg-white border rounded-xl px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500">
              
              {/* Textarea Lebar */}
              <textarea
                ref={textareaRef}
                className="flex-1 bg-transparent border-none outline-none resize-none py-2 text-sm"
                placeholder={selectedVillage ? 'Tanya apa saja...' : 'Pilih desa...'}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading || !selectedVillage}
              />

              {/* Tombol Kirim */}
              <button
                className={`p-2 rounded-lg text-white ${btnDisabled ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={handleSend}
                disabled={btnDisabled}
              >
                {loading ? '...' : '📤'}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">💡 Data pribadi tidak akan ditampilkan</p>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        className={`ai-float-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((p) => !p)}
        title="AI Assistant"
      >
        <span className="ai-float-toggle-icon">{isOpen ? '✕' : '🤖'}</span>
        {!isOpen && <span className="ai-float-toggle-label">AI</span>}
      </button>
    </>
  );
}