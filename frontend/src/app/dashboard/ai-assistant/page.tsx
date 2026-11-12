'use client';

import { useEffect, useRef, useState } from 'react';
import { aiApi } from '@/lib/api/ai';
import { regionsApi } from '@/lib/api/regions';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt?: string;
  isLoading?: boolean;
  tokensUsed?: number;
  responseTimeMs?: number;
}

export default function AIAssistantPage() {
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cek role user
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserRole(parsed.role);
      setUserName(parsed.name || 'User');
      if (parsed.villageId) {
        setSelectedVillage(parsed.villageId);
      }
    }
  }, []);

  // Fetch daftar desa (untuk Super Admin)
  useEffect(() => {
    if (userRole === 'SUPER_ADMIN') {
      const fetchVillages = async () => {
        try {
          const data = await regionsApi.getVillages();
          setVillages(data);
          if (data.length > 0 && !selectedVillage) {
            setSelectedVillage(data[0].id);
          }
        } catch (err) {
          console.error('Gagal mengambil desa:', err);
        }
      };
      fetchVillages();
    }
  }, [userRole]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!selectedVillage) {
      setError('Pilih desa terlebih dahulu');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: 'loading-' + Date.now(),
        role: 'ASSISTANT',
        content: '',
        isLoading: true,
      },
    ]);
    setInput('');
    setLoading(true);
    setError('');

    try {
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
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Gagal mengirim pesan');
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (confirm('Hapus semua percakapan?')) {
      setMessages([]);
      setConversationId(null);
      setError('');
    }
  };

  const formatTime = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const suggestionQuestions = [
    { icon: '👥', text: 'Berapa jumlah penduduk desa?' },
    { icon: '🎯', text: 'Apa visi dan misi desa?' },
    { icon: '👔', text: 'Siapa saja perangkat desa?' },
    { icon: '📋', text: 'Apa program kerja yang sedang berjalan?' },
    { icon: '📰', text: 'Ringkasan berita terbaru' },
    { icon: '📅', text: 'Agenda apa yang akan datang?' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-t-2xl shadow-lg p-4 lg:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl border border-white/30 shadow-lg">
              🤖
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">AI Assistant</h1>
              <p className="text-blue-100 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Online • Siap membantu Anda
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userRole === 'SUPER_ADMIN' && (
              <select
                className="px-3 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl text-sm focus:ring-2 focus:ring-white/50 outline-none"
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
              >
                <option value="" className="text-gray-800">-- Pilih Desa --</option>
                {villages.map((v: any) => (
                  <option key={v.id} value={v.id} className="text-gray-800">
                    {v.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all text-sm font-medium border border-white/30 flex items-center gap-2"
            >
              🗑️ <span className="hidden md:inline">Bersihkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-blue-50/30 p-4 lg:p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-3xl mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-2xl animate-pulse-soft">
              🤖
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-3">
              Halo, {userName}! 👋
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
              Saya adalah asisten AI yang siap membantu Anda mencari informasi tentang desa/kelurahan. 
              Tanyakan apa saja!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {suggestionQuestions.map((q) => (
                <button
                  key={q.text}
                  onClick={() => setInput(q.text)}
                  className="p-4 bg-white rounded-xl shadow-sm hover:shadow-lg text-left transition-all border border-gray-100 hover:border-blue-300 group flex items-center gap-3"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{q.icon}</span>
                  <span className="text-sm text-gray-700 font-medium">{q.text}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-6">
              💡 AI akan menjawab berdasarkan data yang tersedia di sistem
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'USER' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {msg.role === 'ASSISTANT' && (
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-lg text-white shadow-md flex-shrink-0">
                    🤖
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'USER' ? 'order-1' : ''}`}>
                  <div
                    className={
                      msg.role === 'USER'
                        ? 'chat-bubble-user'
                        : 'chat-bubble-ai'
                    }
                  >
                    {msg.isLoading ? (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                        </div>
                        <span className="text-sm text-gray-500">AI sedang menganalisis...</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm lg:text-base leading-relaxed">
                        {msg.content}
                      </p>
                    )}
                  </div>
                  {!msg.isLoading && msg.createdAt && (
                    <div className={`flex items-center gap-2 mt-1.5 px-1 ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                      {msg.tokensUsed && (
                        <span className="text-xs text-gray-400">
                          • {msg.tokensUsed} tokens • {(msg.responseTimeMs! / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === 'USER' && (
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-lg text-white shadow-md flex-shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 px-4 py-2 mx-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white rounded-b-2xl shadow-lg p-3 lg:p-4 border-t border-gray-100">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none text-sm lg:text-base"
              placeholder={
                selectedVillage
                  ? 'Tanya apa saja tentang desa... (Shift+Enter untuk baris baru)'
                  : 'Pilih desa terlebih dahulu'
              }
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || !selectedVillage}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
              {input.length > 0 && `${input.length}/500`}
            </span>
          </div>
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || !selectedVillage}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 font-medium"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>📤</span>
                <span className="hidden md:inline">Kirim</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          💡 AI akan menjawab berdasarkan data yang tersedia. Data pribadi tidak akan ditampilkan.
        </p>
      </div>
    </div>
  );
}