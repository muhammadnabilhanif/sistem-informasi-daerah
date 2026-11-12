'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import AIFloatingChat from '@/components/layout/AIFloatingChat';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // ✅ Tambahkan dark:bg-gray-950 dan dark:text-gray-100
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 min-w-0">
        {children}
      </main>
      <AIFloatingChat />
    </div>
  );
}