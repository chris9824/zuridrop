import { LoginResponseSchema } from './schemas';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const TOKEN_KEY = 'zuridrop_access_token';

/* ── Login ────────────────────────────────────────── */
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Erreur ${res.status}: identifiants incorrects.`);
  }

  const json = await res.json();
  const parsed = LoginResponseSchema.safeParse(json);
  const data = parsed.success ? parsed.data : json;

  // Store token
  if (typeof window !== 'undefined' && data.accessToken) {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
  }

  return data;
}

/* ── Token helpers ────────────────────────────────── */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

/* ── Authenticated fetch helper ───────────────────── */
export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && init.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...init, headers });
}
