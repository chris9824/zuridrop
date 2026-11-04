// En dev sans .env : URL relative → proxy Next.js vers l'API. Sinon : URL complète.
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const TOKEN_KEY = 'zuridrop_admin_token';

export async function loginAdmin(email: string, password: string) {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || 'Identifiants incorrects');
  }

  const data = await res.json();

  if (data.user?.role !== 'ADMIN') {
    throw new Error('Accès réservé aux administrateurs');
  }

  if (typeof window !== 'undefined' && data.accessToken) {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
  }

  return data as {
    accessToken: string;
    user: { id: string; firstName: string; lastName: string; role: string; email: string };
  };
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...init, headers });
}
