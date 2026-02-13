import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/customer/providers';
import { CartProvider } from '@/components/cart/cart-provider';
import { CartConflictDialog } from '@/components/cart/cart-conflict-dialog';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ZuriDrop – Commandez vos plats préférés',
  description: 'Livraison de repas rapide et fiable en Côte d\'Ivoire.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
            {children}
            <CartConflictDialog />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
