import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    // Forward all query params to backend
    const { searchParams } = request.nextUrl;
    const params = new URLSearchParams();

    // Forward known params
    for (const key of ['page', 'limit', 'sort', 'q', 'city', 'isOpenNow']) {
      const val = searchParams.get(key);
      if (val !== null) params.set(key, val);
    }

    const url = `${API_BASE}/api/v1/restaurants?${params.toString()}`;

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      // Don't cache in dev, short cache in prod
      next: { revalidate: process.env.NODE_ENV === 'production' ? 30 : 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend responded with ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[BFF] /api/restaurants error:', err);
    return NextResponse.json(
      { error: 'Impossible de contacter le serveur backend.' },
      { status: 502 },
    );
  }
}
