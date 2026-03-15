import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/driver/toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZuriDrop Driver',
  description: 'Application livreur ZuriDrop',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
