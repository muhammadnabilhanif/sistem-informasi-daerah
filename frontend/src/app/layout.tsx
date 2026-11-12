import type { Metadata } from 'next';
import './style.css'; // Mengarah ke file CSS Anda
import { ThemeProvider } from '@/components/theme-provider'; // ✅ Tambahkan import ini

export const metadata: Metadata = {
  title: 'Sistem Informasi Wilayah',
  description: 'Sistem Informasi Wilayah dan Pemerintahan Berbasis AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ✅ suppressHydrationWarning wajib ada agar tidak error saat pindah mode
    <html lang="id" suppressHydrationWarning>
      <body>
        {/* ✅ Bungkus dengan ThemeProvider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}