import { APP_NAME } from '@zuridrop/shared';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>{APP_NAME} – Admin Panel</h1>
      <p>Bienvenue sur le panneau d&apos;administration.</p>
      <p style={{ color: '#666', marginTop: '1rem' }}>
        Cette page est un placeholder. Les features seront implémentées dans les prochaines étapes.
      </p>
    </main>
  );
}
