'use client';

import { ReactNode } from 'react';

export default function RtLayout({ children }: { children: ReactNode }) {
  // Kita tidak perlu memanggil <Sidebar /> lagi karena sudah ada di layout utama dashboard
  return <>{children}</>;
}