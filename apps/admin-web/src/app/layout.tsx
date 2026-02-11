import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZuriDrop – Admin Panel',
  description: 'Administration panel for the ZuriDrop platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
