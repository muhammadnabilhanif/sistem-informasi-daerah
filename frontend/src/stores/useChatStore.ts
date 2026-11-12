import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt?: string;
  isLoading?: boolean;
  tokensUsed?: number;
  responseTimeMs?: number;
}

interface ChatState {
  messages: Message[];
  conversationId: string | null;
  addMessage: (msg: Message) => void;
  updateMessage: (id: string, msg: Partial<Message>) => void;
  setConversationId: (id: string | null) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  conversationId: null,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  updateMessage: (id, updatedMsg) => set((state) => ({
    messages: state.messages.map(m => m.id === id ? { ...m, ...updatedMsg } : m)
  })),
  setConversationId: (id) => set({ conversationId: id }),
  clearChat: () => set({ messages: [], conversationId: null }),
}));