import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZuriDrop – Merchant Dashboard',
  description: 'Manage your store, products, and orders on ZuriDrop.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
